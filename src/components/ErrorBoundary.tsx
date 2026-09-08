import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

// Without this, any uncaught render-time error anywhere in the tree
// unmounts the entire SPA to a blank screen with no recovery path other
// than a hard refresh the user has no way to know is needed — confirmed
// live when a data-shape bug in one view crashed the whole app on a single
// button click. This does not fix bugs; it stops one bad component from
// taking down the whole session and gives the user a way back.
//
// Note: this project has no @types/react installed (a pre-existing gap —
// `React.Component<Props, State>` generics resolve to nothing usable, since
// there's no real declaration file to inherit `props`/`state`/`setState`
// from), so this class is left untyped like the rest of the app's React
// usage rather than fighting a type system that isn't actually present.
export class ErrorBoundary extends React.Component {
  // `declare`-only fields (no runtime emission): with no @types/react in
  // this project, extending React.Component (typed `any`) does not grant
  // this class the usual inherited `props`/`state`/`setState` members —
  // TypeScript only recognizes members a class declares on itself. These
  // declarations exist purely so tsc accepts the real runtime members React
  // sets up via the actual base class at runtime.
  declare props: any;
  declare state: any;
  declare setState: (state: any) => void;

  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('Uncaught render error:', error, info.componentStack);
  }

  handleReload = () => {
    this.setState({ error: null });
    window.location.reload();
  };

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-slate-900 border border-rose-500/30 rounded-2xl p-6 text-center space-y-4 shadow-2xl">
            <div className="mx-auto h-12 w-12 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Something went wrong</h2>
              <p className="text-xs text-slate-400 mt-1">
                An unexpected error occurred while rendering this page. Your account data is safe on the server — reloading will bring you back to a working screen.
              </p>
            </div>
            <p className="text-[11px] font-mono text-slate-500 bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-left break-words">
              {this.state.error.message}
            </p>
            <button
              onClick={this.handleReload}
              className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm flex items-center justify-center space-x-2 transition-colors"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Reload App</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
