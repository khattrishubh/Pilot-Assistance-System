import { Link, useLocation } from 'react-router-dom'
import { Plane, Cloud, Radar, Activity, TrendingUp } from 'lucide-react'

const Navigation = () => {
  const location = useLocation()

  const navItems = [
    { path: '/', label: 'Dashboard', icon: Activity },
    { path: '/briefing', label: 'Flight Briefing', icon: Plane },
    { path: '/decoder', label: 'Weather Decoder', icon: Cloud },
    { path: '/charts', label: 'Weather Trends', icon: TrendingUp },
  ]

  return (
    <nav className="bg-white shadow-sm border-b border-slate-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Brand */}
          <div className="flex items-center space-x-2">
            <Radar className="h-8 w-8 text-aviation-600" />
            <span className="text-xl font-bold text-slate-900">
              Weather Assistant
            </span>
            <span className="text-sm text-slate-500 font-medium bg-slate-100 px-2 py-1 rounded">
              for Pilots
            </span>
          </div>

          {/* Navigation Links */}
          <div className="flex space-x-1">
            {navItems.map(({ path, label, icon: Icon }) => {
              const isActive = location.pathname === path
              return (
                <Link
                  key={path}
                  to={path}
                  className={`
                    flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200
                    ${
                      isActive
                        ? 'bg-aviation-100 text-aviation-700 border border-aviation-200'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }
                  `}
                >
                  <Icon className="h-4 w-4" />
                  <span>{label}</span>
                </Link>
              )
            })}
          </div>

          {/* Status Indicator */}
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1">
              <div className="h-2 w-2 bg-green-400 rounded-full animate-pulse-slow"></div>
              <span className="text-xs text-slate-500">API Online</span>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navigation