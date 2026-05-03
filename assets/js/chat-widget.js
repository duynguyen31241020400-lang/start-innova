(function () {
  var API_URL = '/api/chat';
  var MAX_HISTORY_PAIRS = 10;
  var history = [];
  var isOpen = false;
  var isTyping = false;

  function init() {
    injectStyles();
    buildDOM();
    bindEvents();
    addBotMessage('Em là Nova — hố đen nhỏ nhất của SIV.\nBạn cần biết gì?');
  }

  function injectStyles() {
    var s = document.createElement('style');
    s.textContent = [
      '#si-fab{position:fixed;bottom:24px;right:24px;z-index:9999;width:56px;height:56px;border-radius:50%;',
      'background:linear-gradient(135deg,#3b82f6,#8b5cf6);border:none;cursor:pointer;display:flex;',
      'align-items:center;justify-content:center;',
      'box-shadow:0 4px 20px rgba(59,130,246,.4);transition:transform .2s,box-shadow .2s;}',
      '#si-fab:hover{transform:scale(1.08);box-shadow:0 6px 28px rgba(59,130,246,.6);}',
      '#si-panel{position:fixed;bottom:92px;right:24px;z-index:9999;width:340px;max-height:500px;',
      'background:#111;border:1px solid rgba(255,255,255,.1);border-radius:20px;',
      'display:flex;flex-direction:column;overflow:hidden;',
      'box-shadow:0 8px 40px rgba(0,0,0,.7);transition:opacity .2s,transform .2s;}',
      '#si-panel.si-hide{opacity:0;transform:translateY(10px) scale(.97);pointer-events:none;}',
      '#si-head{padding:14px 16px;background:linear-gradient(135deg,rgba(59,130,246,.12),rgba(139,92,246,.12));',
      'border-bottom:1px solid rgba(255,255,255,.08);display:flex;align-items:center;gap:10px;flex-shrink:0;}',
      '.si-av{width:34px;height:34px;border-radius:50%;background:linear-gradient(135deg,#3b82f6,#8b5cf6);',
      'display:flex;align-items:center;justify-content:center;font-size:15px;flex-shrink:0;}',
      '.si-ht{font-size:14px;font-weight:600;color:#fff;font-family:inherit;}',
      '.si-hs{font-size:11px;color:#6b7280;font-family:inherit;}',
      '#si-msgs{flex:1;overflow-y:auto;padding:12px;display:flex;flex-direction:column;gap:8px;',
      'scrollbar-width:thin;scrollbar-color:rgba(255,255,255,.08) transparent;}',
      '.si-m{max-width:86%;padding:9px 13px;border-radius:14px;font-size:13px;line-height:1.55;',
      'word-break:break-word;white-space:pre-wrap;font-family:inherit;}',
      '.si-bot{align-self:flex-start;background:rgba(255,255,255,.07);color:#e5e7eb;border-bottom-left-radius:4px;}',
      '.si-usr{align-self:flex-end;background:linear-gradient(135deg,#3b82f6,#8b5cf6);color:#fff;border-bottom-right-radius:4px;}',
      '.si-err{align-self:flex-start;background:rgba(239,68,68,.15);color:#fca5a5;border-bottom-left-radius:4px;}',
      '.si-dots{display:flex;gap:4px;align-items:center;padding:2px 0;}',
      '.si-dots span{width:6px;height:6px;border-radius:50%;background:#6b7280;animation:si-b 1.2s infinite;}',
      '.si-dots span:nth-child(2){animation-delay:.2s}.si-dots span:nth-child(3){animation-delay:.4s}',
      '@keyframes si-b{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-5px)}}',
      '#si-foot{padding:10px 12px;border-top:1px solid rgba(255,255,255,.08);display:flex;gap:8px;align-items:center;flex-shrink:0;}',
      '#si-inp{flex:1;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);',
      'border-radius:10px;padding:8px 12px;color:#fff;font-size:13px;outline:none;',
      'transition:border-color .2s;font-family:inherit;}',
      '#si-inp:focus{border-color:rgba(59,130,246,.5);}',
      '#si-inp::placeholder{color:#4b5563;}',
      '#si-send{width:34px;height:34px;border-radius:50%;background:linear-gradient(135deg,#3b82f6,#8b5cf6);',
      'border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;',
      'flex-shrink:0;transition:opacity .2s;}',
      '#si-send:disabled{opacity:.35;cursor:not-allowed;}',
      '@media(max-width:400px){#si-panel{width:calc(100vw - 32px);right:16px;}#si-fab{right:16px;bottom:16px;}}'
    ].join('');
    document.head.appendChild(s);
  }

  function buildDOM() {
    // Floating button
    var fab = document.createElement('button');
    fab.id = 'si-fab';
    fab.setAttribute('aria-label', 'Chat với Nova');
    fab.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';

    // Panel
    var panel = document.createElement('div');
    panel.id = 'si-panel';
    panel.className = 'si-hide';
    panel.innerHTML =
      '<div id="si-head">' +
        '<div class="si-av">🕳️</div>' +
        '<div><div class="si-ht">Nova</div><div class="si-hs">Hố đen · SIV mascot chính thức</div></div>' +
      '</div>' +
      '<div id="si-msgs"></div>' +
      '<div id="si-foot">' +
        '<input id="si-inp" type="text" placeholder="Hỏi về Start Innova…" maxlength="500" autocomplete="off" />' +
        '<button id="si-send" aria-label="Gửi">' +
          '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>' +
        '</button>' +
      '</div>';

    document.body.appendChild(fab);
    document.body.appendChild(panel);
  }

  function bindEvents() {
    document.getElementById('si-fab').addEventListener('click', togglePanel);
    document.getElementById('si-send').addEventListener('click', sendMessage);
    document.getElementById('si-inp').addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
    });
  }

  function togglePanel() {
    isOpen = !isOpen;
    document.getElementById('si-panel').classList.toggle('si-hide', !isOpen);
    if (isOpen) {
      document.getElementById('si-inp').focus();
      scrollBottom();
    }
  }

  function addBotMessage(text) {
    appendMsg('si-bot', text);
  }

  function appendMsg(cls, text) {
    var el = document.createElement('div');
    el.className = 'si-m ' + cls;
    el.textContent = text;
    document.getElementById('si-msgs').appendChild(el);
    scrollBottom();
    return el;
  }

  function showTyping() {
    var el = document.createElement('div');
    el.className = 'si-m si-bot';
    el.innerHTML = '<div class="si-dots"><span></span><span></span><span></span></div>';
    document.getElementById('si-msgs').appendChild(el);
    scrollBottom();
    return el;
  }

  function scrollBottom() {
    var msgs = document.getElementById('si-msgs');
    msgs.scrollTop = msgs.scrollHeight;
  }

  async function sendMessage() {
    if (isTyping) return;
    var inp = document.getElementById('si-inp');
    var sendBtn = document.getElementById('si-send');
    var text = inp.value.trim();
    if (!text) return;

    inp.value = '';
    appendMsg('si-usr', text);
    isTyping = true;
    sendBtn.disabled = true;
    var dot = showTyping();

    try {
      var res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history: history }),
      });
      var data = await res.json();
      dot.remove();

      if (!res.ok) throw new Error(data.error || 'Lỗi không xác định');

      history.push({ role: 'user', text: text });
      history.push({ role: 'model', text: data.reply });
      if (history.length > MAX_HISTORY_PAIRS * 2) {
        history = history.slice(-MAX_HISTORY_PAIRS * 2);
      }

      addBotMessage(data.reply);
    } catch (err) {
      dot.remove();
      appendMsg('si-err', err.message || 'Không kết nối được. Thử lại sau nhé!');
    } finally {
      isTyping = false;
      sendBtn.disabled = false;
      inp.focus();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
