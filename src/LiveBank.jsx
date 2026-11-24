import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert, Button, Chip, Divider, MenuItem, TextField, Tooltip,
} from '@mui/material';
import {
  ArrowLeftRight, Building2, CheckCircle2,
  CircleHelp, Clock3, Globe2, Landmark, List, LogOut, RefreshCw,
  Send, ShieldCheck, Wallet,
} from 'lucide-react';
import { toPaise } from './amount';
import { configuredEndpoint, liveApi, parseEndpoint, readStorage, saveStorage } from './live-api';
import './live.css';
import { PortalPreview, RegistrationPreview } from './PortalPreview';

const money = minor => new Intl.NumberFormat('en-IN', {
  style: 'currency', currency: 'INR', minimumFractionDigits: 2,
}).format((Number(minor) || 0) / 100);
const time = value => value ? new Intl.DateTimeFormat('en-IN', {
  dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata',
}).format(new Date(value)) : '—';

const statusNames = {
  PENDING: 'Pending', PROCESSING: 'Processing', COMPLETED: 'Completed',
  REJECTED: 'Rejected', MANUAL_REVIEW: 'Manual review',
};
const rejectionNames = {
  INSUFFICIENT_FUNDS: 'Insufficient available balance',
  LIMIT_EXCEEDED: 'Transfer limit exceeded',
  DESTINATION_ACCOUNT_UNAVAILABLE: 'The destination is unavailable',
};
const byId = (directory, id) => directory.find(item => item.bankId === id)?.bankName || id || 'Unknown bank';

function MetricCard({ icon: Icon, label, value, helper, tone = 'blue' }) {
  return <div className={`metric-card metric-${tone}`}>
    <div className="metric-top"><span>{label}</span><span className="metric-icon"><Icon size={18} /></span></div>
    <strong>{value}</strong>
    <small>{helper}</small>
  </div>;
}

function TransferForm({ bank, accounts, directory, send }) {
  const [type, setType] = useState('interbank');
  const [from, setFrom] = useState('');
  const [destination, setDestination] = useState('');
  const [number, setNumber] = useState('');
  const [amount, setAmount] = useState('200');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const sources = accounts.filter(account => account.status === 'ACTIVE');
  const fromId = sources.some(item => item.accountId === from) ? from : (sources[0]?.accountId || '');
  const routes = directory.filter(item => item.bankId !== bank.id && item.status === 'ACTIVE');
  const route = destination ? (routes.find(item => item.ifsc === destination)?.ifsc || '') : (routes[0]?.ifsc || '');
  const target = type === 'internal' ? bank.ifsc : route;

  async function submit(event) {
    event.preventDefault();
    setError('');
    const amountMinor = toPaise(amount);
    if (!fromId || !target || !number.trim() || amountMinor === null) {
      setError('Choose an active source account, destination and a positive amount with at most two decimal places.');
      return;
    }
    setBusy(true);
    try {
      await send({ fromAccountId: fromId, destinationIfsc: target,
        destinationAccountNumber: number.trim(), amountMinor, currency: 'INR' });
      setNumber('');
    } catch (failure) { setError(failure.message); }
    finally { setBusy(false); }
  }

  return <section className="panel live-transfer">
    <header className="panel-head"><div><span className="eyebrow">PAYMENTS</span><h2>Make a transfer</h2>
      <p>Send money through the connected banking network.</p></div><span className="panel-symbol"><Send size={19} /></span></header>
    <form className="transfer-form" onSubmit={submit}>
      <div className="type-switch" role="group" aria-label="Transfer type">
        {[['interbank', 'Other bank'], ['internal', 'Within ZenVolt']].map(([value, label]) => <Button key={value}
          type="button" aria-pressed={type === value} variant={type === value ? 'contained' : 'outlined'}
          disabled={busy} onClick={() => { setType(value); setError(''); }}>{label}</Button>)}
      </div>
      <TextField select label="Pay from" required value={fromId} onChange={e => setFrom(e.target.value)} disabled={busy || !sources.length}>
        {sources.map(account => <MenuItem key={account.accountId} value={account.accountId}>
          {account.accountNumber} · {money(account.availableMinor)} available
        </MenuItem>)}
      </TextField>
      {type === 'interbank' && <TextField select label="Receiving bank" required value={route}
        onChange={e => setDestination(e.target.value)} disabled={busy || !routes.length}>
        {routes.map(item => <MenuItem key={item.ifsc} value={item.ifsc}>{item.bankName} · {item.ifsc}</MenuItem>)}
      </TextField>}
      {type === 'internal' && <div className="destination-note"><Landmark size={17} /><span><strong>{bank.name}</strong><small>{bank.ifsc} · Same-bank transfer</small></span></div>}
      <TextField label="Receiving account number" required value={number} onChange={e => setNumber(e.target.value)} disabled={busy}
        inputProps={{ autoComplete: 'off', maxLength: 24 }} />
      <TextField label="Amount (INR)" required value={amount} onChange={e => setAmount(e.target.value)} disabled={busy}
        helperText="Enter an amount up to two decimal places" slotProps={{ htmlInput: { inputMode: 'decimal' } }} />
      {error && <Alert severity="error">{error}</Alert>}
      <Button type="submit" variant="contained" disabled={busy || !fromId || !target} fullWidth startIcon={<Send size={16} />}>
        {busy ? 'Submitting transfer…' : 'Continue transfer'}
      </Button>
      <div className="secure-note"><ShieldCheck size={15} /> Transfer requests are validated by the bank service.</div>
    </form>
  </section>;
}

function Activity({ rows, directory }) {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('ALL');
  const filtered = useMemo(() => rows.filter(row => {
    const search = [row.transferId, row.sourceBankId, row.destinationBankId, row.status].join(' ').toLowerCase();
    return search.includes(query.trim().toLowerCase()) && (status === 'ALL' || row.status === status);
  }), [rows, query, status]);

  return <section className="panel activity-panel"><header className="panel-head activity-head"><div>
    <span className="eyebrow">ACCOUNT ACTIVITY</span><h2>Recent transfers</h2><p>Latest transfer records returned by your bank.</p>
  </div><span className="panel-symbol"><List size={19} /></span></header>
    <div className="activity-tools"><TextField size="small" label="Search transfers" value={query} onChange={e => setQuery(e.target.value)} />
      <TextField select size="small" label="Status" value={status} onChange={e => setStatus(e.target.value)}>
        <MenuItem value="ALL">All statuses</MenuItem>
        {Object.keys(statusNames).map(key => <MenuItem key={key} value={key}>{statusNames[key]}</MenuItem>)}
      </TextField>
      <Chip label={`${filtered.length} shown`} size="small" variant="outlined" />
    </div>
    {filtered.length ? <div className="table-scroll"><table>
      <thead><tr><th>Transfer details</th><th>Bank route</th><th>Amount</th><th>Status</th></tr></thead>
      <tbody>{filtered.map(row => <tr key={row.transferId}>
        <td><strong className="mono">{row.transferId}</strong><small>{time(row.createdAt)}</small></td>
        <td><strong>{byId(directory, row.sourceBankId)} → {byId(directory, row.destinationBankId)}</strong><small>
          {row.type === 'INTERNAL' ? 'Same bank' : row.direction === 'CREDIT' ? 'Incoming' : 'Outgoing'}
        </small></td>
        <td className={row.direction === 'CREDIT' ? 'incoming amount' : 'amount'}>{row.direction === 'CREDIT' ? '+' : '−'}{money(row.amountMinor)}</td>
        <td><Chip size="small" label={statusNames[row.status] || row.status}
          className={`status-chip live-${row.status?.toLowerCase() || 'unknown'}`} />
          {row.code && <small>{rejectionNames[row.code] || row.code.toLowerCase().replaceAll('_', ' ')}</small>}</td>
      </tr>)}</tbody>
    </table></div> : <div className="empty"><ArrowLeftRight size={23} /><strong>{rows.length ? 'No matching transfers' : 'No transfers yet'}</strong>
      <p>{rows.length ? 'Try a different search or status filter.' : 'Your transfer activity will appear here when available.'}</p></div>}
  </section>;
}

export default function LiveBank({ bank, switchUrl, openDemo }) {
  const urlKey = 'x42-cloudflare-worker-url';
  const [base, setBase] = useState(() => configuredEndpoint || readStorage(localStorage, urlKey, ''));
  const [session, setSession] = useState(null);
  const [portalMode, setPortalMode] = useState('login');
  const prefix = '/banks/' + bank.id;
  const [url, setUrl] = useState(base);
  const [editUrl, setEditUrl] = useState(!base);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [note, setNote] = useState('');
  const [data, setData] = useState({ accounts: [], transfers: [] });
  const [directory, setDirectory] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const activeToken = useRef(null);
  activeToken.current = session?.token;
  const pending = useRef(new Map());
  const accounts = data.accounts || [];
  const transfers = data.transfers || [];
  const totalAvailable = accounts.reduce((sum, account) => sum + (Number(account.availableMinor) || 0), 0);
  const totalHeld = accounts.reduce((sum, account) => sum + (Number(account.heldMinor) || 0), 0);
  const completedCount = transfers.filter(row => row.status === 'COMPLETED').length;

  const refresh = useCallback(async signal => {
    if (!session) return;
    try {
      const value = await liveApi(base, prefix + '/dashboard', { token: session.token, signal });
      if (signal?.aborted || activeToken.current !== session.token) return;
      setData({ accounts: value.accounts || [], transfers: value.transfers || [] });
      setLastUpdated(new Date());
      setLoaded(true);
      setError('');
    } catch (failure) {
      if (signal?.aborted || activeToken.current !== session.token) return;
      if (failure.status === 401) {
        setSession(null); setData({ accounts: [], transfers: [] }); setLoaded(false);
      }
      setError(failure.message);
    }
  }, [base, prefix, session]);

  useEffect(() => {
    if (!session) return undefined;
    const controller = new AbortController();
    const update = () => { if (document.visibilityState === 'visible') refresh(controller.signal); };
    refresh(controller.signal);
    const timer = setInterval(update, 12_000);
    document.addEventListener('visibilitychange', update);
    return () => { clearInterval(timer); controller.abort(); document.removeEventListener('visibilitychange', update); };
  }, [session, refresh]);

  useEffect(() => {
    if (!session) return undefined;
    const controller = new AbortController();
    liveApi(base, '/directory/banks', { signal: controller.signal })
      .then(value => setDirectory(value.banks || []))
      .catch(failure => { if (!controller.signal.aborted) setError(failure.message); });
    return () => controller.abort();
  }, [base, session]);

  function logout() {
    setSession(null); setLoaded(false); setData({ accounts: [], transfers: [] });
    setNote(''); setLastUpdated(null); setDirectory([]);
  }

  async function signIn(event) {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const value = await liveApi(base, prefix + '/sign-in', { data: { email: email.trim(), password } });
      setSession(value);
    } catch (failure) { setError(failure.message); }
    finally { setPassword(''); setBusy(false); }
  }

  function connect(event) {
    event.preventDefault(); setError('');
    try {
      const endpoint = parseEndpoint(url);
      if (endpoint !== base) { logout(); setDirectory([]); }
      saveStorage(localStorage, urlKey, endpoint); setBase(endpoint); setEditUrl(false);
    } catch (failure) { setError(failure.message); }
  }

  async function send(transfer) {
    const raw = JSON.stringify([bank.id, base, session.uid, transfer]);
    const bytes = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw)));
    const hash = Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
    const keyName = 'x42-pending-' + hash;
    const key = pending.current.get(keyName) || readStorage(sessionStorage, keyName, null) || crypto.randomUUID();
    pending.current.set(keyName, key); saveStorage(sessionStorage, keyName, key);
    const row = await liveApi(base, prefix + '/transfers', { token: session.token, data: transfer, key });
    pending.current.delete(keyName); saveStorage(sessionStorage, keyName, null);
    const verb = row.status === 'COMPLETED' ? 'Completed' : row.status === 'REJECTED' ? 'Rejected' :
      row.status === 'MANUAL_REVIEW' ? 'Manual review' : 'Accepted';
    setNote(verb + ' · ' + row.transferId);
    await refresh();
  }

  return <div className="layout live-bank-layout">
    <aside className="sidebar"><div className="brand"><span className="brand-icon"><Landmark size={23} /></span>
      <span><strong>{bank.wordmark}</strong><small>YOUR DIGITAL BANK</small></span></div>
      <div className="sidebar-caption">BANKING</div>
      <nav aria-label="Bank actions">
        {session && <button className="active" onClick={() => refresh()}><Wallet size={18} /> Overview <span className="nav-live-dot" /></button>}
        {session && <button onClick={() => refresh()}><RefreshCw size={18} /> Refresh accounts</button>}
        {!configuredEndpoint && <button onClick={() => { setUrl(base); setEditUrl(!editUrl); }}><Globe2 size={18} /> Worker connection</button>}
        {openDemo && <button onClick={openDemo}><ArrowLeftRight size={18} /> Browser demo</button>}
        {session && <button onClick={logout}><LogOut size={18} /> Sign out</button>}
      </nav>
      <div className="sidebar-bottom"><div className="help-card"><CircleHelp size={17} /><strong>Need assistance?</strong><small>Contact your bank administrator for account support.</small></div>
        <a className="switch-link" href={switchUrl}><Globe2 size={17} /> SharedBank switch</a>
      </div>
    </aside>
    <div className="main">
      <header className="topbar"><div><span className="topbar-kicker">BANKING PORTAL</span><strong>{bank.name} <span className="topbar-id">· {bank.id}</span></strong></div>
        <div className="topbar-right"><Chip label="Network connected" size="small" className="network-chip" />
          {session && <Tooltip title="Refresh account data"><Button onClick={() => refresh()} size="small" variant="outlined" startIcon={<RefreshCw size={15} />}>Refresh</Button></Tooltip>}
        </div></header>
      <main className="content live-bank-content">
        {!session ? (portalMode === 'admin' || portalMode === 'customer' ? <PortalPreview mode={portalMode} onBack={() => setPortalMode('login')} /> : portalMode === 'register' ? <RegistrationPreview onBack={() => setPortalMode('login')} /> : <div className="auth-layout">
          <section className="auth-brand-panel"><div className="auth-orbit orbit-one" /><div className="auth-orbit orbit-two" />
            <div className="auth-brand-content"><span className="auth-kicker">BANKING, REIMAGINED</span>
              <h1>Move forward<br />with confidence.</h1><p>A simpler, more connected way to manage your money with {bank.name}.</p>
              <div className="auth-points"><span><ShieldCheck size={17} /> Secure bank connection</span><span><Building2 size={17} /> Connected banking network</span></div>
            </div><div className="auth-brand-footer"><span>{bank.ifsc}</span><span>INDIA · INR</span></div>
          </section>
          <section className="auth-main"><div className="auth-form-wrap">
            <span className="eyebrow">WELCOME BACK</span><h2>Sign in to your account</h2>
            <p className="auth-subtitle">Access your ZenVolt Bank account securely.</p>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {editUrl ? <form className="transfer-form auth-form" onSubmit={connect}>
              <TextField label="Bank service URL" fullWidth required value={url} onChange={e => setUrl(e.target.value)} helperText="Enter the HTTPS origin of your existing Cloudflare Worker." />
              <Button type="submit" variant="contained" fullWidth>Connect to bank service</Button>
            </form> : <form className="transfer-form auth-form" onSubmit={signIn}>
              <TextField label="Email address" type="email" autoComplete="username" required fullWidth value={email} onChange={e => setEmail(e.target.value)} />
              <TextField label="Password" type="password" autoComplete="current-password" required fullWidth value={password} onChange={e => setPassword(e.target.value)} />
              <Button type="submit" variant="contained" fullWidth disabled={busy}>{busy ? 'Signing in…' : 'Sign in securely'}</Button>
              <div className="secure-note"><ShieldCheck size={15} /> Authentication is handled by the connected bank service.</div>
              {!configuredEndpoint && <button type="button" className="text-action" onClick={() => { setUrl(base); setEditUrl(true); }}>Change service connection</button>}
            </form>}
            <Divider sx={{ my: 2.5 }} />
            <div className="portal-entry-actions">
              <Button variant="outlined" onClick={() => setPortalMode('register')}>Open a new account</Button>
              <Button variant="text" onClick={() => setPortalMode('customer')}>Customer portal preview</Button>
              <Button variant="text" onClick={() => setPortalMode('admin')}>Admin portal preview</Button>
            </div>
            <div className="auth-footnote">By continuing, you agree to use this portal in accordance with your bank's terms and security policies.</div>
          </div></section>
        </div>) : <>
          <div className="welcome-row"><div><span className="eyebrow">ACCOUNT OVERVIEW</span><h1>Good to see you{session.email ? `, ${session.email.split('@')[0]}` : ''}.</h1>
            <p>Here’s what’s happening with your bank accounts today.</p></div><div className="updated-label"><Clock3 size={14} /> {lastUpdated ? `Updated ${time(lastUpdated)}` : 'Waiting for account data'}</div></div>
          {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}
          {note && <Alert severity="info" onClose={() => setNote('')}>{note}</Alert>}
          {!loaded && <Alert severity="info">Loading your account information from the bank service…</Alert>}
          {loaded && !accounts.length && <Alert severity="info">This signed-in user has no account returned by the bank service. Contact your bank administrator to check account assignment.</Alert>}
          <div className="metrics-grid">
            <MetricCard icon={Wallet} label="Total available" value={money(totalAvailable)} helper={`${accounts.length} account${accounts.length === 1 ? '' : 's'} linked`} />
            <MetricCard icon={ShieldCheck} label="Funds on hold" value={money(totalHeld)} helper="Currently held across accounts" tone="teal" />
            <MetricCard icon={CheckCircle2} label="Completed transfers" value={String(completedCount)} helper="In the latest activity returned" tone="green" />
            <MetricCard icon={ArrowLeftRight} label="Recent transfers" value={String(transfers.length)} helper="Records returned by the service" tone="gold" />
          </div>
          <div className="section-title-row"><div><h2>Your accounts</h2><p>Account balances supplied by the bank service.</p></div><Chip label={`${accounts.length} linked`} size="small" variant="outlined" /></div>
          <div className="accounts">{accounts.map((account, i) => <section key={account.accountId} className={`account-card ${i === 0 ? 'primary-account' : 'light-account'}`}>
            <div className="account-head"><span>{i === 0 ? 'PRIMARY ACCOUNT' : 'SAVINGS ACCOUNT'}</span><Landmark size={19} /></div>
            <div><div className="account-value">{money(account.availableMinor)}</div><div className="account-balance-caption">Available balance</div></div>
            <div className="account-foot"><span>{account.accountNumber}</span><span>{account.accountId}</span></div>
            <div className="account-held">Held balance: {money(account.heldMinor)}</div>
          </section>)}</div>
          <div className="bank-workspace"><TransferForm bank={bank} accounts={accounts} directory={directory} send={send} />
            <section className="panel network-panel"><header className="panel-head"><div><span className="eyebrow">BANK NETWORK</span><h2>Connected destination banks</h2><p>Read-only directory information from the shared network.</p></div><span className="panel-symbol"><Globe2 size={19} /></span></header>
              {directory.filter(item => item.status === 'ACTIVE' && item.bankId !== bank.id).slice(0, 5).map(item => <div className="directory-row" key={item.bankId}>
                <span className="directory-icon"><Landmark size={16} /></span><span><strong>{item.bankName}</strong><small>{item.ifsc}</small></span><Chip size="small" label="Active" className="directory-active" />
              </div>)}
              {!directory.some(item => item.status === 'ACTIVE' && item.bankId !== bank.id) && <div className="directory-empty">No other active banks were returned by the directory.</div>}
              <div className="directory-footer">Directory is displayed as provided by the shared banking service.</div>
            </section>
          </div>
          <Activity rows={transfers} directory={directory} />
        </>}
        <footer className="app-footer"><span><ShieldCheck size={14} /> Secure connection · {bank.name}</span><span>{bank.ifsc} · All times in IST</span></footer>
      </main>
    </div>
  </div>;
}
