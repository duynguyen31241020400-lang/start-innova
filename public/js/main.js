(function () {
  var burger = document.getElementById('burger');
  var drawer = document.getElementById('nav-mobile');
  if (!burger || !drawer) return;

  function close() {
    burger.classList.remove('open');
    drawer.classList.remove('open');
    burger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  burger.addEventListener('click', function () {
    var open = burger.classList.toggle('open');
    drawer.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', String(open));
    document.body.style.overflow = open ? 'hidden' : '';
  });
  drawer.addEventListener('click', function (e) {
    if (e.target.tagName === 'A') close();
  });
  window.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') close();
  });
})();
