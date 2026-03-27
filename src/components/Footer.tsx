import { Link } from "react-router-dom";

const Footer = () => (
  <footer className="border-t border-border bg-card py-12">
    <div className="container">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <span className="font-display text-xl font-extrabold text-gradient-storm">BizVibe</span>
          <p className="mt-3 text-sm text-muted-foreground font-body">
            Build, ship, and grow together. The collective where vibecoding meets real pipeline.
          </p>
        </div>
        <div>
          <h4 className="font-display text-sm font-semibold text-foreground mb-3">Navigate</h4>
          <div className="flex flex-col gap-2">
            <Link to="/" className="text-sm text-muted-foreground hover:text-purple-soft font-body">Home</Link>
            <Link to="/community" className="text-sm text-muted-foreground hover:text-purple-soft font-body">Community</Link>
            <Link to="/get-going" className="text-sm text-muted-foreground hover:text-purple-soft font-body">Get Going</Link>
          </div>
        </div>
        <div>
          <h4 className="font-display text-sm font-semibold text-foreground mb-3">Company</h4>
          <div className="flex flex-col gap-2">
            <Link to="/about" className="text-sm text-muted-foreground hover:text-purple-soft font-body">About</Link>
            <Link to="/contact" className="text-sm text-muted-foreground hover:text-purple-soft font-body">Contact</Link>
          </div>
        </div>
        <div>
          <h4 className="font-display text-sm font-semibold text-foreground mb-3">Connect</h4>
          <p className="text-sm text-muted-foreground font-body">#shiphappens</p>
        </div>
      </div>
      <div className="mt-8 pt-8 border-t border-border text-center">
        <p className="text-xs text-muted-foreground font-body">© {new Date().getFullYear()} BizVibe Collective. All rights reserved.</p>
      </div>
    </div>
  </footer>
);

export default Footer;
