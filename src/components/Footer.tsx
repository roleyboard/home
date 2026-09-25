export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="site-footer">
      <div className="footer-identity">
        <a className="footer-wordmark" href="#top" aria-label="MUSUK, back to top">
          <h6>MUSUK</h6>
        </a>
        <p>LISTEN • LEARN • PLAY • SING • PERFORM</p>
      </div>

      <div className="footer-meta">
        <a className="back-to-top" href="#top">
          Back to top <span aria-hidden="true">&#8593;</span>
        </a>

        <p>&copy; {year} MUSUK. All rights reserved.</p>
      </div>
    </footer>
  )
}
