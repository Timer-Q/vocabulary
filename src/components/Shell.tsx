import { NavLink, Outlet, useLocation } from 'react-router-dom'

const links = [
  { to: '/', label: '今天', end: true },
  { to: '/roots', label: '词库', end: false },
  { to: '/study', label: '学习', end: false },
]

export function Shell() {
  const location = useLocation()
  return (
    <div className="app-shell">
      <header className="topbar">
        <NavLink to="/" className="brand" end>
          <span className="brand__mark">根</span>
          <span>
            词根词汇
            <small>拆开，再记住</small>
          </span>
        </NavLink>
        <nav className="topnav">
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.end}>
              {link.label}
            </NavLink>
          ))}
        </nav>
        <NavLink to="/me" className="quiet-link">
          进度
        </NavLink>
      </header>
      <main key={location.pathname} className="page">
        <Outlet />
      </main>
      <nav className="tabbar">
        {links.map((link) => (
          <NavLink key={link.to} to={link.to} end={link.end}>
            {link.label}
          </NavLink>
        ))}
        <NavLink to="/me">进度</NavLink>
      </nav>
    </div>
  )
}
