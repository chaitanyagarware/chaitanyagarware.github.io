const menu = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#navigation');
menu.addEventListener('click', () => {
  const open = menu.getAttribute('aria-expanded') === 'true';
  menu.setAttribute('aria-expanded', String(!open));
  navigation.classList.toggle('open', !open);
});
navigation.addEventListener('click', event => {
  if (event.target.closest('a')) {
    menu.setAttribute('aria-expanded', 'false');
    navigation.classList.remove('open');
  }
});
