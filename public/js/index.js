/* eslint-disable */
import '@babel/polyfill';
import { displayMap } from './mapbox';
import { login, logout } from './login';
import { updateSettings } from './updateSettings';

// DOM ELEMENTS // only if these DOM elements exists else we get error in console.
const mapBox = document.getElementById('map'); //
const loginForm = document.querySelector('.form--login');
const logOutBtn = document.querySelector('.nav__el--logout'); /// if there is a logout btn currently,, click event wait
const userDataForm = document.querySelector('.form-user-data'); // update form is present in curr DOM account.pug
const userPasswordForm = document.querySelector('.form-user-password'); // if DOM has password form

// DELEGATION
if (mapBox) {
  const locations = JSON.parse(mapBox.dataset.locations);
  displayMap(locations);
}

if (loginForm)
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault(); // restrict default DOM behaviour of reloading the page on submit
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    login(email, password);
  });

if (logOutBtn) logOutBtn.addEventListener('click', logout);

if (userDataForm)
  userDataForm.addEventListener('submit', (e) => {
    e.preventDefault(); // restrict default DOM behaviour of reloading the page on submit
    const form = new FormData();
    form.append('name', document.getElementById('name').value);
    form.append('email', document.getElementById('email').value);
    form.append('photo', document.getElementById('photo').files[0]);
    // console.log(form);
    // console.log('through');
    // const name = document.getElementById('name').value;
    // const email = document.getElementById('email').value;

    updateSettings(form, 'data');
  });

if (userPasswordForm)
  userPasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault(); // restrict default DOM behaviour of reloading the page on submit

    // as soon as btn click we chnge the text to show the effect
    document.querySelector('.btn--save-password').textContent = 'Updating...';

    const passwordCurrent = document.getElementById('password-current').value;
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('password-confirm').value;
    await updateSettings(
      { passwordCurrent, password, passwordConfirm },
      'password',
    );
    ////  clearing the passwrd field after they have been sent to req to endpoint
    document.querySelector('.btn--save-password').textContent = 'Save password';
    document.getElementById('password-current').value = '';
    document.getElementById('password').value = '';
    document.getElementById('password-confirm').value = '';
  });
