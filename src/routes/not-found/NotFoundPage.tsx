import { Link } from 'react-router';
import ui from '../../styles/ui.module.css';

export function NotFoundPage() {
  return (
    <div className={ui.page}>
      <title>Page not found · Dome</title>
      <h1>Page not found</h1>
      <p>
        That page does not exist. Go back to the <Link to="/">home page</Link> or <Link to="/check/repo">check a repo</Link>.
      </p>
    </div>
  );
}
