export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="site-footer">
      <div className="footer-identity">
        <a className="footer-wordmark" href="#top" aria-label="Damian, back to top">
          DAMIAN
        </a>
        <p>Original music. Stories in sound.</p>
      </div>

      <div className="footer-meta">
        <a className="back-to-top" href="#top">
          Back to top <span aria-hidden="true">&#8593;</span>
        </a>
        <p>&copy; {year} Damian. All rights reserved.</p>
      </div>
    </footer>
  )
}
