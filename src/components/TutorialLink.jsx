import { Link } from "react-router-dom";

export function TutorialLink({ section }) {
  return (
    <Link className="tutorial-link" to={`/tutorial#${section}`}>
      Tutorial
    </Link>
  );
}
