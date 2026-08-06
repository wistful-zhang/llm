export const ADMIN_HTML = `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>评论管理</title>
  <link rel="stylesheet" href="/admin/style.css">
</head>
<body>
  <main>
    <header>
      <div><p class="eyebrow">大模型面经</p><h1>评论管理</h1></div>
      <div class="header-actions"><button id="export" class="quiet" hidden>导出 JSON</button><button id="logout" class="quiet" hidden>退出</button></div>
    </header>
    <section id="login" class="card">
      <h2>管理员登录</h2>
      <p>令牌只保存在当前标签页的 sessionStorage，关闭标签页后自动清除。</p>
      <form id="login-form">
        <label>ADMIN_TOKEN<input id="token" type="password" autocomplete="off" minlength="32" required></label>
        <button>进入管理</button>
      </form>
    </section>
    <section id="dashboard" hidden>
      <div id="stats" class="stats"></div>
      <nav><button data-view="reports" class="active">待处理举报</button><button data-view="comments">最新评论</button></nav>
      <p id="message" role="status"></p>
      <div id="items" class="items"></div>
      <button id="more" class="quiet" hidden>加载更多</button>
    </section>
  </main>
  <script type="module" src="/admin/app.js"></script>
</body>
</html>`;

export const ADMIN_CSS = `:root{color-scheme:light;--ink:#202124;--muted:#6b7280;--line:#e5e7eb;--paper:#fff;--wash:#f7f7f3;--accent:#176b5b;--danger:#b42318}*{box-sizing:border-box}body{margin:0;background:var(--wash);color:var(--ink);font:15px/1.6 system-ui,-apple-system,"Segoe UI",sans-serif}main{width:min(920px,calc(100% - 32px));margin:40px auto}header{display:flex;align-items:end;justify-content:space-between;margin-bottom:24px}.header-actions{display:flex;gap:8px}.eyebrow{margin:0;color:var(--accent);font-weight:700}h1{margin:2px 0;font-size:30px}h2{margin-top:0}.card,.item,.stats>div{background:var(--paper);border:1px solid var(--line);border-radius:12px;padding:18px}.card{max-width:520px}label{display:grid;gap:6px;color:var(--muted)}input,button,textarea{font:inherit}input,textarea{width:100%;border:1px solid #cbd5e1;border-radius:8px;padding:10px;background:#fff}button{border:0;border-radius:8px;padding:9px 14px;background:var(--accent);color:#fff;cursor:pointer}button.quiet,nav button{background:#fff;color:var(--ink);border:1px solid var(--line)}nav{display:flex;gap:8px;margin:20px 0}nav button.active{background:var(--ink);color:#fff}.stats{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.stats strong{display:block;font-size:24px}.stats span,.meta{color:var(--muted);font-size:13px}.items{display:grid;gap:12px}.item p{white-space:pre-wrap;overflow-wrap:anywhere}.actions{display:flex;gap:8px;flex-wrap:wrap}.actions .danger{background:var(--danger)}#message{min-height:24px;color:var(--muted)}@media(max-width:600px){main{margin:20px auto}.stats{grid-template-columns:1fr}header{align-items:start;gap:12px;flex-wrap:wrap}}`;

export const ADMIN_JS = `const state={view:"reports",cursor:0};
const byId=id=>document.getElementById(id);
const token=()=>sessionStorage.getItem("commentsAdminToken")||"";
async function api(path,options={}){const response=await fetch(path,{...options,headers:{"content-type":"application/json",authorization:"Bearer "+token(),...(options.headers||{})}});if(response.status===401){logout();throw new Error("令牌无效");}const data=await response.json();if(!response.ok)throw new Error(data.error?.message||"请求失败");return data;}
function node(tag,text,className){const el=document.createElement(tag);if(text!==undefined)el.textContent=text;if(className)el.className=className;return el;}
function showDashboard(){byId("login").hidden=true;byId("dashboard").hidden=false;byId("logout").hidden=false;byId("export").hidden=false;refresh();}
function logout(){sessionStorage.removeItem("commentsAdminToken");byId("login").hidden=false;byId("dashboard").hidden=true;byId("logout").hidden=true;byId("export").hidden=true;byId("token").value="";}
function say(message){byId("message").textContent=message;}
async function loadStats(){const data=await api("/v1/admin/overview");const stats=byId("stats");stats.replaceChildren();[[data.visibleComments,"公开评论"],[data.pendingReports,"待处理举报"],[data.lockedThreads,"已锁评论区"]].forEach(([value,label])=>{const box=node("div");box.append(node("strong",String(value)),node("span",label));stats.append(box);});}
function actionButton(label,action,id,danger=false){const button=node("button",label,danger?"danger":"");button.addEventListener("click",async()=>{if(action==="delete"&&!confirm("这会永久清空评论正文且无法恢复，确定继续？"))return;const prompted=prompt("处理备注（点取消可中止操作）");if(prompted===null)return;const reason=prompted;try{if(state.view==="reports")await api("/v1/admin/reports/"+encodeURIComponent(id),{method:"PATCH",body:JSON.stringify({action,reason})});else await api("/v1/admin/comments/"+encodeURIComponent(id),{method:"PATCH",body:JSON.stringify({action,reason})});await refresh();}catch(error){say(error.message);}});return button;}
function renderReport(item){const card=node("article",undefined,"item");card.append(node("div","举报 · "+item.questionSlug+" · "+item.createdAt,"meta"),node("p",item.reason),node("div","评论 #"+item.comment.floor+" "+item.comment.nickname+"："+item.comment.body,"meta"));const actions=node("div",undefined,"actions");actions.append(actionButton("隐藏评论","hide",item.id,true),actionButton("忽略举报","dismiss",item.id));card.append(actions);return card;}
function threadButton(item){const shouldLock=!item.threadLocked;const button=node("button",shouldLock?"锁定此题新评论":"重新开放此题",shouldLock?"danger":"");button.addEventListener("click",async()=>{const promptText=shouldLock?"锁定后访客不能发布新评论或回复，但仍可举报和管理自己的内容。确定锁定？":"确定重新开放这道题的评论区？";if(!confirm(promptText))return;try{await api("/v1/admin/questions/"+encodeURIComponent(item.questionSlug),{method:"PATCH",body:JSON.stringify({locked:shouldLock})});say(shouldLock?"已锁定这道题的新评论。":"这道题已重新开放。");await refresh();}catch(error){say(error.message);}});return button;}
function renderComment(item){const card=node("article",undefined,"item");card.append(node("div",item.questionSlug+" · #"+item.floor+" · "+(item.threadLocked?"评论区已锁 · ":"")+item.createdAt,"meta"),node("strong",item.nickname),node("p",item.body));const actions=node("div",undefined,"actions");if(item.status==="hidden")actions.append(actionButton("恢复公开","show",item.id));else actions.append(actionButton("隐藏","hide",item.id,true));actions.append(actionButton("彻底删除内容","delete",item.id,true),threadButton(item));card.append(actions);return card;}
async function load(reset=false){if(reset){state.cursor=0;byId("items").replaceChildren();}say("加载中…");try{const path=state.view==="reports"?"/v1/admin/reports?status=pending&cursor="+state.cursor:"/v1/admin/comments?cursor="+state.cursor;const data=await api(path);data.items.forEach(item=>byId("items").append(state.view==="reports"?renderReport(item):renderComment(item)));state.cursor=data.nextCursor??state.cursor;byId("more").hidden=data.nextCursor===null;say(data.items.length?"":"暂无内容");}catch(error){say(error.message);}}
async function refresh(){await Promise.all([loadStats(),load(true)]);}
async function downloadExport(){say("正在生成导出文件…");try{const response=await fetch("/v1/admin/export",{headers:{authorization:"Bearer "+token()}});if(response.status===401){logout();throw new Error("令牌无效");}if(!response.ok){const data=await response.json();throw new Error(data.error?.message||"导出失败");}const blob=await response.blob();const url=URL.createObjectURL(blob);const link=document.createElement("a");link.href=url;link.download="comments-export-"+new Date().toISOString().slice(0,10)+".json";document.body.append(link);link.click();link.remove();URL.revokeObjectURL(url);say("导出完成。文件不包含编辑凭证、来源限流键或管理员令牌。");}catch(error){say(error.message);}}
byId("login-form").addEventListener("submit",event=>{event.preventDefault();sessionStorage.setItem("commentsAdminToken",byId("token").value);showDashboard();});
byId("logout").addEventListener("click",logout);byId("export").addEventListener("click",downloadExport);byId("more").addEventListener("click",()=>load(false));document.querySelectorAll("[data-view]").forEach(button=>button.addEventListener("click",()=>{state.view=button.dataset.view;document.querySelectorAll("[data-view]").forEach(candidate=>candidate.classList.toggle("active",candidate===button));load(true);}));
if(token())showDashboard();`;

export function adminAssetResponse(pathname) {
  const headers = {
    "cache-control": "no-store",
    "content-security-policy": "default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'",
    "referrer-policy": "no-referrer",
    "x-content-type-options": "nosniff",
    "x-frame-options": "DENY",
  };
  if (pathname === "/admin" || pathname === "/admin/") {
    return new Response(ADMIN_HTML, { headers: { ...headers, "content-type": "text/html; charset=utf-8" } });
  }
  if (pathname === "/admin/app.js") {
    return new Response(ADMIN_JS, { headers: { ...headers, "content-type": "text/javascript; charset=utf-8" } });
  }
  if (pathname === "/admin/style.css") {
    return new Response(ADMIN_CSS, { headers: { ...headers, "content-type": "text/css; charset=utf-8" } });
  }
  return null;
}
