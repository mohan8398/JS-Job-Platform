import { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, MapPin, Clock, Briefcase, FileText, Send, Sparkles, Loader2, ArrowUpRight, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE_URL = 'http://localhost:5000/api';

const LOGO_COLORS = [
  { lc: '#635bff', lb: '#f0eeff' }, { lc: '#059669', lb: '#ecfdf5' }, { lc: '#2563eb', lb: '#eff6ff' },
  { lc: '#ea580c', lb: '#fff7ed' }, { lc: '#0891b2', lb: '#ecfeff' }, { lc: '#9333ea', lb: '#faf5ff' },
  { lc: '#dc2626', lb: '#fef2f2' }, { lc: '#0f172a', lb: '#f8fafc' }, { lc: '#7c3aed', lb: '#f5f3ff' },
  { lc: '#0369a1', lb: '#f0f9ff' }, { lc: '#be185d', lb: '#fdf2f8' }, { lc: '#b45309', lb: '#fffbeb' },
];

const getLogoStyle = (company = '') => {
  let hash = 0;
  for (let c of company) hash = (hash * 31 + c.charCodeAt(0)) & 0xffffffff;
  return LOGO_COLORS[Math.abs(hash) % LOGO_COLORS.length];
};

const getInitials = (name = '') =>
  name.split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase();

const App = () => {
  const [jobs, setJobs] = useState([]);
  const [appliedJobs, setAppliedJobs] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedJob, setSelectedJob] = useState(null);
  const [servingSource, setServingSource] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [activeFilters, setActiveFilters] = useState(new Set(['remote', 'fulltime', 'india']));

  const filterLabels = {
    remote: '🌍 Remote', fulltime: 'Full-time', contract: 'Contract',
    senior: 'Senior', mid: 'Mid-level', junior: 'Junior',
    startup: 'Startup', enterprise: 'Enterprise', india: '🇮🇳 India', us: '🇺🇸 US / Canada'
  };

  const toggleFilter = (f) => {
    const next = new Set(activeFilters);
    next.has(f) ? next.delete(f) : next.add(f);
    setActiveFilters(next);
  };

  const doSearch = async () => {
    if (isSearching) return;
    setIsSearching(true);
    setError('');
    setHasSearched(true);

    try {
      // const filtersStr = [...activeFilters].join(', ') || 'any';
      const res = await axios.get(`${API_BASE_URL}/jobs`, {
        params: { query: search || 'Node.js MERN Stack' }
      });
      setJobs(res.data.jobs || []);
      setServingSource(res.data.source || '');
    } catch (err) {
      console.error('Search failed:', err);
      const msg = err.response?.data?.error || err.message;
      setError(msg);
      setJobs([]);
    } finally {
      setIsSearching(false);
    }
  };

  const fetchAppliedJobs = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/applied`);
      setAppliedJobs(res.data);
    } catch (_) { }
  };

  useEffect(() => { fetchAppliedJobs(); }, []);

  const openApplyModal = (job) => {
    setSelectedJob(job);
    setIsSubmitted(false);
    setShowModal(true);
  };

  const handleApplySubmit = async (e) => {
    e.preventDefault();
    if (!selectedJob) return;
    try {
      await axios.post(`${API_BASE_URL}/apply`, {
        jobId: selectedJob.id,
        title: selectedJob.title,
        company: selectedJob.company,
        location: selectedJob.location,
      });
      fetchAppliedJobs();
      setIsSubmitted(true);
    } catch (_) {
      alert('Error saving application');
    }
  };

  return (
    <div>
      {/* NAV */}
      <nav>
        <div className="logo">
          <div className="logo-icon">N</div>
          <span className="logo-text">Node</span>
        </div>
        <div className="nav-badge"><span className="live-dot"></span> AI-Powered Live Search</div>
        <div className="nav-right">
          <div className="nav-a">Salaries</div>
          <div className="nav-a">Companies</div>
        </div>
      </nav>

      {/* HERO */}
      <div className="hero">
        <div className="pill"><span className="pill-dot"></span> Real-time AI Job Search</div>
        <h1>Find live <span className="hl">Node.js openings</span></h1>
        <p className="hero-p">AI searches and generates real-time job</p>

        <div className="search-wrap">
          <div className="sfield">
            <Search size={16} />
            <input
              type="text"
              placeholder="e.g. Senior Node.js engineer, remote, TypeScript…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && doSearch()}
            />
          </div>
          <button className="sbtn" onClick={doSearch} disabled={isSearching}>
            {isSearching ? (
              <><Loader2 size={15} className="animate-spin" /> Searching…</>
            ) : (
              <><Search size={15} /> Search</>
            )}
          </button>
        </div>

        {/* <div className="filters">
          {Object.entries(filterLabels).map(([key, label]) => (
            <div key={key} className={`chip ${activeFilters.has(key) ? 'on' : ''}`} onClick={() => toggleFilter(key)}>
              {label}
            </div>
          ))}
        </div> */}
      </div>

      {/* STATS BAR */}
      <div className="stats-bar">
        <div className="stat-left">
          {isSearching ? (
            <span className="stream-badge">
              <span className="stream-dots"><span></span><span></span><span></span></span>
              AI generating results…
            </span>
          ) : hasSearched ? (
            <><b>{jobs.length}</b> roles found · Filters: <b>{[...activeFilters].join(' · ') || 'none'}</b> · <span style={{ color: 'var(--green)', fontWeight: 700 }}>✓ AI-generated results</span></>
          ) : (
            <>Search for Node.js jobs above to get <b>AI-generated live results</b></>
          )}
        </div>
        <div className="ai-badge">
          <Sparkles size={12} /> {servingSource ? `Model: ${servingSource}` : 'Verified from LinkedIn, Indeed, Instahyre'}
        </div>
      </div>

      {/* CONTENT */}
      <div className="wrap">
        {error && (
          <div className="error-box" style={{ background: 'var(--red-lt)', border: '1.5px solid #fecaca', borderRadius: '12px', padding: '18px 22px', marginBottom: '20px' }}>
            <p style={{ fontSize: '.85rem', color: '#991b1b' }}><b>Couldn't fetch results.</b> {error}<br />Please check your API key and try again.</p>
          </div>
        )}

        {isSearching ? (
          <div className="grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(316px, 1fr))', gap: '15px' }}>
            {[1, 2, 3, 4, 5, 6].map(n => (
              <div key={n} className="skel">
                <div className="skel-logo"></div>
                <div className="skel-line w80"></div>
                <div className="skel-line w60"></div>
                <div className="skel-line w90" style={{ height: 10 }}></div>
                <div className="skel-line w40" style={{ marginTop: 16 }}></div>
              </div>
            ))}
          </div>
        ) : jobs.length > 0 ? (
          <div className="grid">
            <AnimatePresence mode="popLayout">
              {jobs.map((job, idx) => {
                const { lc, lb } = getLogoStyle(job.company);
                const initials = getInitials(job.company);
                return (
                  <motion.div
                    key={job.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className={`card${job.featured ? ' feat' : ''}`}
                    onClick={() => openApplyModal(job)}
                  >
                    <div className="chead">
                      <div className="clogo" style={{ background: lb, color: lc }}>{initials}</div>
                      {job.badge === 'featured' && <span className="badge featured">⭐ Featured</span>}
                      {job.badge === 'new' && <span className="badge new">✦ New</span>}
                      {job.badge === 'hot' && <span className="badge hot">🔥 Hot</span>}
                    </div>
                    <div className="ctitle">{job.title}</div>
                    <div className="cco">
                      <Briefcase size={12} /> {job.company} · {job.location}
                    </div>
                    <div style={{ fontSize: '.78rem', color: '#64748b', margin: '10px 0', lineBreak: 'anywhere', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', height: '2.4em' }}>
                      {job.description}
                    </div>
                    <div className="tags">
                      {(job.tags || []).slice(0, 4).map((t, ti) => (
                        <span key={ti} className={`tag${ti < 2 ? ' g' : ''}`}>{t}</span>
                      ))}
                      <span className="tag">{job.type}</span>
                    </div>
                    <div className="cdiv"></div>
                    <div className="cfoot">
                      <div>
                        <div className="csal">{job.salary}</div>
                        <div className="ctime"><Clock size={10} /> {job.posted}</div>
                      </div>
                      <a
                        href={job.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="apply-btn"
                        onClick={(e) => e.stopPropagation()}
                        style={{ textDecoration: 'none' }}
                      >
                        Apply <ArrowUpRight size={11} />
                      </a>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        ) : (
          <div className="empty" style={{ textAlign: 'center', padding: '80px 0', color: 'var(--muted)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>{hasSearched ? '🛰️' : '🔍'}</div>
            {hasSearched ? (
              <p><b>No openings found at the moment.</b><br />The AI scanner couldn't find active roles for this specific query.<br />Try adjusting your filters or search terms.</p>
            ) : (
              <p><b>Enter your search above</b> to start the AI scanner.<br />AI will generate fresh, relevant job listings just for you.</p>
            )}
          </div>
        )}
      </div>

      {/* APPLY MODAL */}
      <AnimatePresence>
        {showModal && (
          <div className="ov" onClick={(e) => e.target.className === 'ov' && setShowModal(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              className="modal"
            >
              <div className="mhdr">
                <div>
                  <h2>Apply for this role</h2>
                  <p style={{ fontSize: '.78rem', color: 'var(--sub)' }}>{selectedJob?.company} · {selectedJob?.location} · {selectedJob?.type}</p>
                </div>
                <button className="xbtn" onClick={() => setShowModal(false)}>✕</button>
              </div>
              <div className="mbody">
                {!isSubmitted ? (
                  <>
                    <div className="jprev">
                      <div className="jpl" style={{ background: getLogoStyle(selectedJob?.company).lb, color: getLogoStyle(selectedJob?.company).lc }}>
                        {getInitials(selectedJob?.company)}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '.87rem', fontWeight: 700 }}>{selectedJob?.title}</div>
                        <div style={{ fontSize: '.73rem', color: 'var(--sub)', marginTop: 2 }}>{selectedJob?.company} · {selectedJob?.location}</div>
                      </div>
                      <a
                        href={selectedJob?.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ background: 'var(--green)', color: '#fff', padding: '6px 12px', borderRadius: 6, fontSize: '.75rem', fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}
                      >
                        Apply on Site <ArrowUpRight size={12} />
                      </a>
                    </div>

                    <div style={{ margin: '16px 0', padding: '12px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                      <h4 style={{ fontSize: '.75rem', textTransform: 'uppercase', color: '#64748b', marginBottom: 8, letterSpacing: '.05em' }}>Job Details</h4>
                      <p style={{ fontSize: '.82rem', color: '#334155', lineHeight: 1.5 }}>
                        {selectedJob?.description || "This role involves working on cutting-edge Node.js applications, optimizing performance, and building scalable features."}
                      </p>
                    </div>

                    {/* <div style={{ textAlign: 'center', margin: '20px 0', position: 'relative' }}>
                      <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0' }} />
                      <span style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: '#fff', padding: '0 10px', fontSize: '.7rem', color: '#94a3b8', fontWeight: 600 }}>OR QUICK APPLY</span>
                    </div> */}

                    {/* <form onSubmit={handleApplySubmit}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div className="fg"><label>First Name</label><input type="text" placeholder="Arjun" required /></div>
                        <div className="fg"><label>Last Name</label><input type="text" placeholder="Sharma" required /></div>
                      </div>
                      <div className="fg"><label>Email Address</label><input type="email" placeholder="you@email.com" required /></div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div className="fg"><label>Phone</label><input type="tel" placeholder="+91 98765 43210" /></div>
                        <div className="fg">
                          <label>Node.js Experience</label>
                          <select><option value="">Select…</option><option>1–2 years</option><option>3–5 years</option><option>5–8 years</option><option>8+ years</option></select>
                        </div>
                      </div>
                      <div className="fg"><label>LinkedIn / Portfolio URL</label><input type="url" placeholder="https://linkedin.com/in/yourname" /></div>
                      <div className="fg">
                        <label>Why are you a great fit?</label>
                        <textarea placeholder="Briefly describe your experience and excitement for this role…" style={{ resize: 'vertical', minHeight: 76 }}></textarea>
                      </div>
                      <div className="fg">
                        <label>Resume / CV</label>
                        <div style={{ border: '2px dashed var(--border2)', borderRadius: 10, padding: 20, textAlign: 'center', background: 'var(--bg)', cursor: 'pointer' }}>
                          <div style={{ fontSize: '1.5rem', marginBottom: 6 }}>📄</div>
                          <p><strong style={{ color: 'var(--green)' }}>Click to upload</strong> or drag & drop</p>
                          <small style={{ fontSize: '.7rem', color: 'var(--muted)' }}>PDF, DOC, DOCX · Max 5 MB</small>
                        </div>
                      </div>
                      <button type="submit" className="sub-btn">
                        <Send size={16} /> Submit Application
                      </button>
                    </form> */}
                  </>
                ) : (
                  <div style={{ textAlign: 'center', padding: '8px 0' }}>
                    <div style={{ width: 66, height: 66, borderRadius: '50%', background: 'var(--green-lt)', border: '2px solid var(--green-mid)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', fontSize: '1.7rem' }}>✓</div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: 7 }}>Application Sent! 🎉</h3>
                    <p style={{ fontSize: '.84rem', color: 'var(--sub)', lineHeight: 1.65 }}>Your application is on its way.<br />Expect to hear back within 3–5 business days.</p>
                    <button style={{ display: 'inline-block', marginTop: 18, background: 'var(--bg)', border: '1.5px solid var(--border)', borderRadius: 9, padding: '9px 20px', fontFamily: 'var(--font)', fontSize: '.82rem', fontWeight: 700, cursor: 'pointer' }} onClick={() => setShowModal(false)}>Browse more roles →</button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;
