import { describe, expect, it } from 'vitest';
import { fileUrl, parseGitHubRepo } from './github';

describe('parseGitHubRepo', () => {
  it.each([
    'https://github.com/octocat/Hello-World',
    'https://github.com/octocat/Hello-World.git',
    'https://github.com/octocat/Hello-World/tree/main/src',
    'http://www.github.com/octocat/Hello-World',
    'github.com/octocat/Hello-World',
    'octocat/Hello-World',
    '  octocat/Hello-World  ',
  ])('accepts %s', (input) => {
    expect(parseGitHubRepo(input)).toEqual({ owner: 'octocat', repo: 'Hello-World', url: 'https://github.com/octocat/Hello-World' });
  });

  it.each([
    '',
    'https://gitlab.com/octocat/Hello-World',
    'https://github.com.evil.example/octocat/x',
    'https://user:pass@github.com/octocat/x',
    'https://github.com/octocat',
    'https://github.com/-bad/x',
    'https://github.com/octocat/..',
    'javascript:alert(1)',
    'file:///etc/passwd',
  ])('rejects %s', (input) => {
    expect(parseGitHubRepo(input)).toBeNull();
  });
});

describe('fileUrl', () => {
  const repo = { owner: 'o', repo: 'r' };
  const commit = '7fd1a60b01f91b314f59955a4e4d4e80d8edf11d';

  it('encodes each path segment and adds a line anchor', () => {
    expect(fileUrl(repo, commit, '.vscode/tasks file#1.json', 5)).toBe(`https://github.com/o/r/blob/${commit}/.vscode/tasks%20file%231.json#L5`);
  });

  it('refuses bad commits and repos', () => {
    expect(fileUrl(repo, 'main', 'a')).toBeNull();
    expect(fileUrl({ owner: 'o', repo: '..' }, commit, 'a')).toBeNull();
  });
});
