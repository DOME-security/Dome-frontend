import { isRouteErrorResponse, Link, useRouteError } from 'react-router';
import { m } from '../../i18n';
import ui from '../../styles/ui.module.css';

/** Last-resort error page. Never shows the raw error, which could contain untrusted text. */
export function RouteError() {
  const error = useRouteError();
  const notFound = isRouteErrorResponse(error) && error.status === 404;
  const t = m.notFound;
  return (
    <div className={ui.page}>
      <title>{m.app.titleSuffix(notFound ? t.title : t.errorPageTitle)}</title>
      <h1>{notFound ? t.title : t.errorTitle}</h1>
      <p>{notFound ? t.body : t.errorBody}</p>
      <p>
        <Link to="/">{t.errorHome}</Link>
      </p>
    </div>
  );
}
