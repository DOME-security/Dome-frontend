#!/usr/bin/env node
// Writes src/vendor/rules.json from a dome-backend checkout, until
// dome-backend publishes rules.json itself.
//
//   node scripts/sync-rules.mjs ../Dome-backend
//
// The rule sources are parsed with the TypeScript compiler and only literal
// values are read. Nothing from the checkout is imported or executed.
import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const backend = process.argv[2];
if (!backend) {
  console.error('usage: node scripts/sync-rules.mjs <dome-backend checkout>');
  process.exit(2);
}
const rulesDir = path.join(backend, 'packages/engine/src/rules');
const commit = execFileSync('git', ['-C', backend, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();

function parse(file) {
  return ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
}

/** Evaluates literal expressions only; anything else is an error. */
function literal(node, scope) {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  if (ts.isNumericLiteral(node)) return Number(node.text);
  if (ts.isParenthesizedExpression(node) || ts.isAsExpression(node) || ts.isSatisfiesExpression(node))
    return literal(node.expression, scope);
  if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.PlusToken) {
    return literal(node.left, scope) + literal(node.right, scope);
  }
  if (ts.isArrayLiteralExpression(node)) return node.elements.map((e) => literal(e, scope));
  if (ts.isObjectLiteralExpression(node)) {
    const out = {};
    for (const prop of node.properties) {
      if (!ts.isPropertyAssignment(prop)) throw new Error(`unsupported property at ${node.getSourceFile().fileName}`);
      out[prop.name.getText().replace(/^['"]|['"]$/g, '')] = literal(prop.initializer, scope);
    }
    return out;
  }
  if (ts.isPropertyAccessExpression(node) && ts.isIdentifier(node.expression) && scope[node.expression.text]) {
    const value = scope[node.expression.text][node.name.text];
    if (value === undefined) throw new Error(`unknown reference ${node.getText()}`);
    return value;
  }
  throw new Error(`non-literal value ${node.getText().slice(0, 60)} in ${node.getSourceFile().fileName}`);
}

// Shared constants such as REFS.
const scope = {};
const shared = parse(path.join(rulesDir, 'shared.ts'));
shared.forEachChild((node) => {
  if (!ts.isVariableStatement(node)) return;
  for (const decl of node.declarationList.declarations) {
    if (ts.isIdentifier(decl.name) && decl.initializer) {
      try {
        scope[decl.name.text] = literal(decl.initializer, scope);
      } catch {
        // Not a literal table; rules cannot reference it.
      }
    }
  }
});

const rules = [];
for (const name of readdirSync(rulesDir).sort()) {
  if (!/^[a-z]{3}-\d{3}\.ts$/.test(name)) continue;
  const source = parse(path.join(rulesDir, name));
  let meta;
  source.forEachChild(function visit(node) {
    if (ts.isCallExpression(node) && node.expression.getText() === 'defineRule' && node.arguments[0]) {
      meta = literal(node.arguments[0], scope);
    }
    if (!meta) node.forEachChild(visit);
  });
  if (!meta) throw new Error(`no defineRule() metadata in ${name}`);
  const { id, title, category, severity, summary, reasons, doc } = meta;
  rules.push({ id, title, category, severity, summary, reasons, why: doc?.why, references: doc?.references ?? [] });
}

const out = {
  source: { repository: 'https://github.com/DOME-security/Dome-backend', commit, path: 'packages/engine/src/rules' },
  rules: rules.sort((a, b) => a.id.localeCompare(b.id)),
};
const target = new URL('../src/vendor/rules.json', import.meta.url);
writeFileSync(target, `${JSON.stringify(out, null, 2)}\n`);
console.log(`wrote ${rules.length} rules from dome-backend@${commit.slice(0, 12)}`);
