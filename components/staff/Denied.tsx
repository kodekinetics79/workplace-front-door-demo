export function Denied({ what }: { what: string }) {
  return (<div className="panel" role="status" style={{ maxWidth: 640 }}><h2>Not available for your role</h2><p>Your role cannot open {what}. The server enforces this rule; hiding the menu item is not the control.</p></div>);
}
