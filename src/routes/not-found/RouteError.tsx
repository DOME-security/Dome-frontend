import { isRouteErrorResponse, Link, useRouteError } from 'react-router';
import ui from '../../styles/ui.module.css';

/** Last-resort error page. Never shows the raw error, which could contain untrusted text. */
export function RouteError() {
  const error = useRouteError();
  const notFound = isRouteErrorResponse(error) && error.status === 404;
  return (
    <div className={ui.page}>
      <title>Error · Dome</title>
      <h1>{notFound ? 'Page not found' : 'Something went wrong'}</h1>
      <p>
        {notFound ? 'That page does not exist.' : 'The page failed to load. Reload to try again; if it keeps happening, the app may have been updated.'}
      </p>
      <p>
        <Link to="/">Go to the home page</Link>
      </p>
    </div>
  );
}
