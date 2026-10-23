/**
 * Perry Static Index Generator
 * A dependency-free TUNA-inspired directory listing for Render Static Sites.
 *
 * Render settings:
 *   Build Command:     node generate-index.js
 *   Publish Directory: site
 *
 * The script never edits the original files. It publishes a filtered copy to site/.
 */
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const source = process.cwd();
const publish = path.join(source, 'site');
const listingName = '__perry_list__.html';
const excludedDirectories = new Set(['.git', '.github', 'node_modules', 'site', '.next', '.cache', '__pycache__']);
const excludedFiles = new Set(['generate-index.js', '.gitignore', '.DS_Store']);

function permitted(relative, isDirectory) {
  const name = path.basename(relative);
  if (name === '.env' || name.startsWith('.env.')) return false;
  if (isDirectory && excludedDirectories.has(name)) return false;
  if (!isDirectory && excludedFiles.has(name)) return false;
  return true;
}
function copyTree(input, output, relative = '') {
  fs.mkdirSync(output, { recursive: true });
  for (const entry of fs.readdirSync(input, { withFileTypes: true })) {
    const sub = relative ? `${relative}/${entry.name}` : entry.name;
    if (!permitted(sub, entry.isDirectory()) || entry.isSymbolicLink()) continue;
    if (entry.isDirectory()) copyTree(path.join(input, entry.name), path.join(output, entry.name), sub);
    else if (entry.isFile()) fs.copyFileSync(path.join(input, entry.name), path.join(output, entry.name));
  }
}
function escapeHTML(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}
function encodePath(relative) {
  return relative.split('/').filter(Boolean).map(encodeURIComponent).join('/');
}
function hasOriginalIndex(relative) {
  return fs.existsSync(path.join(source, relative, 'index.html'));
}
function browserURL(relative) {
  const base = relative ? '/' + encodePath(relative) + '/' : '/';
  return base + (hasOriginalIndex(relative) ? listingName : '');
}
function sizeText(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KiB', 'MiB', 'GiB', 'TiB'];
  let n = bytes / 1024;
  let i = 0;
  while (n >= 1024 && i < units.length - 1) { n /= 1024; i++; }
  return `${n.toFixed(n < 10 ? 1 : 0)} ${units[i]}`;
}
const dates = new Map();
function lastGitDate(relative) {
  if (dates.has(relative)) return dates.get(relative);
  let value = '—';
  try {
    const v = execFileSync('git', ['log', '-1', '--format=%cs', '--', relative],
      { cwd: source, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 4000 }).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(v)) value = v;
  } catch (_) { /* repo history may not be present on some build hosts */ }
  dates.set(relative, value);
  return value;
}
function isListed(relative, entry) {
  return permitted(relative, entry.isDirectory()) && !entry.isSymbolicLink() && (entry.isFile() || entry.isDirectory());
}
function pageHTML(relative, entries) {
  const parts = relative ? relative.split('/') : [];
  const displayPath = '/' + (relative ? relative + '/' : '');
  const crumbs = [`<a href="${browserURL('')}">/</a>`];
  parts.forEach((part, i) => {
    const rel = parts.slice(0, i + 1).join('/');
    crumbs.push(`<a href="${escapeHTML(browserURL(rel))}">${escapeHTML(part)}/</a>`);
  });
  const parent = parts.length ? parts.slice(0, -1).join('/') : null;
  const parentRow = parent === null ? '' : `<tr class="parent"><td><a href="${escapeHTML(browserURL(parent))}"><span class="ico">↩</span> Parent directory/</a></td><td>—</td><td>—</td></tr>`;
  const rows = entries.map(entry => {
    const rel = relative ? `${relative}/${entry.name}` : entry.name;
    const isDir = entry.isDirectory();
    const stat = fs.statSync(path.join(source, rel));
    const name = entry.name + (isDir ? '/' : '');
    const href = isDir ? browserURL(rel) : '/' + encodePath(rel);
    const date = lastGitDate(rel);
    return `<tr data-name="${escapeHTML(entry.name.toLocaleLowerCase())}" data-type="${isDir ? 'dir' : 'file'}" data-size="${isDir ? -1 : stat.size}" data-date="${escapeHTML(date)}">
      <td><a href="${escapeHTML(href)}"><span class="ico ${isDir ? 'folder' : 'file'}">${isDir ? '▸' : '▫'}</span>${escapeHTML(name)}</a></td>
      <td class="size">${isDir ? '—' : sizeText(stat.size)}</td><td class="date">${escapeHTML(date)}</td>
    </tr>`;
  }).join('\n');
  return `<!DOCTYPE html>
<html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Index of ${escapeHTML(displayPath)} · Perry</title>
<style>
:root{color-scheme:light dark;--bg:#fff;--fg:#24292f;--muted:#667085;--line:#e5e7eb;--link:#0969da;--hover:#f4f7fc;--head:#f6f8fa}
@media(prefers-color-scheme:dark){:root{--bg:#101419;--fg:#e8edf3;--muted:#9ba9b8;--line:#303841;--link:#7db6ff;--hover:#1b2633;--head:#191f27}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--fg);font:14px/1.55 -apple-system,BlinkMacSystemFont,"Segoe UI",Arial,"PingFang SC","Microsoft YaHei",sans-serif}
header{padding:18px max(20px,calc((100vw - 1100px)/2));background:var(--head);border-bottom:1px solid var(--line)}
.brand{font-weight:650;font-size:16px;color:var(--fg);text-decoration:none}.sub{font-size:12px;color:var(--muted);margin-left:10px}
main{max-width:1100px;padding:24px 20px 75px;margin:auto}h1{font-weight:600;font-size:25px;margin:0 0 8px;overflow-wrap:anywhere}
nav{font-size:13px;color:var(--muted);margin-bottom:25px;display:flex;gap:9px;flex-wrap:wrap}
a{color:var(--link);text-decoration:none}a:hover{text-decoration:underline}
.table-wrap{overflow-x:auto;border:1px solid var(--line);border-radius:6px}table{width:100%;border-collapse:collapse;text-align:left;white-space:nowrap}
th{background:var(--head);font-weight:600;color:var(--muted);font-size:12px}th,td{padding:10px 14px;border-bottom:1px solid var(--line)}tbody tr:last-child td{border-bottom:0}tbody tr:hover{background:var(--hover)}
th:first-child,td:first-child{width:65%}th button{font:inherit;font-weight:inherit;color:inherit;padding:0;border:0;cursor:pointer;background:none;text-align:left}
th button:hover{color:var(--link)}.ico{display:inline-block;width:23px;color:var(--muted);font-size:16px}.folder{color:#d9a441}.file{color:var(--muted)}
.size,.date{color:var(--muted);font-variant-numeric:tabular-nums}footer{margin-top:17px;font-size:12px;color:var(--muted)}
@media(max-width:520px){main{padding:18px 10px}header{padding:13px 15px}h1{font-size:20px}th,td{padding:9px 8px;font-size:12px}.date{font-size:11px}}
</style></head><body>
<header><a class="brand" href="${escapeHTML(browserURL(''))}">Perry / Index</a><span class="sub">Static file archive</span></header>
<main><h1>Index of ${escapeHTML(displayPath)}</h1><nav aria-label="Breadcrumb">${crumbs.join(' <span>›</span> ')}</nav>
<div class="table-wrap"><table><thead><tr><th><button type="button" data-sort="name">File Name ↕</button></th><th><button type="button" data-sort="size">File Size ↕</button></th><th><button type="button" data-sort="date">Date ↕</button></th></tr></thead>
<tbody>${parentRow}${rows}</tbody></table></div>
<footer>${entries.length} items · Automatically generated from the GitHub repository</footer></main>
<script>
let current='name',reverse=false;
for(const btn of document.querySelectorAll('button[data-sort]'))btn.addEventListener('click',()=>{
 const field=btn.dataset.sort;reverse=current===field?!reverse:false;current=field;
 const body=document.querySelector('tbody');const items=[...body.querySelectorAll('tr[data-name]')];
 items.sort((a,b)=>{
  if(a.dataset.type!==b.dataset.type)return a.dataset.type==='dir'?-1:1;
  const c=field==='size'?Number(a.dataset.size)-Number(b.dataset.size):
   field==='date'?a.dataset.date.localeCompare(b.dataset.date):a.dataset.name.localeCompare(b.dataset.name,undefined,{numeric:true});
  return reverse?-c:c;
 });items.forEach(item=>body.append(item));
});
</script></body></html>`;
}
function generate(relative = '') {
  const dir = path.join(source, relative);
  const entries = fs.readdirSync(dir, { withFileTypes: true })
    .filter(e => isListed(relative ? `${relative}/${e.name}` : e.name, e))
    .sort((a, b) => Number(b.isDirectory()) - Number(a.isDirectory()) || a.name.localeCompare(b.name, undefined, { numeric: true }));
  const indexFile = hasOriginalIndex(relative) ? listingName : 'index.html';
  if (entries.some(e => e.name === listingName) && indexFile === listingName) {
    throw new Error(`Reserved file conflict: ${path.join(relative, listingName)}`);
  }
  fs.writeFileSync(path.join(publish, relative, indexFile), pageHTML(relative, entries));
  for (const entry of entries) if (entry.isDirectory()) generate(relative ? `${relative}/${entry.name}` : entry.name);
}

fs.rmSync(publish, { recursive: true, force: true });
copyTree(source, publish);
generate();
console.log('Perry directory index built in site/.');
if (hasOriginalIndex('')) console.log(`Root index.html already exists: browse files at /${listingName}`);
else console.log('Browse files at /');
