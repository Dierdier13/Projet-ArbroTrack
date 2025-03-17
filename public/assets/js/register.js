const signUpButton = document.getElementById('signUp');
const signInButton = document.getElementById('signIn');
const containerRegister = document.getElementById('container');
const signInContainer = document.getElementById('in')

signUpButton.addEventListener('click', () => {
	containerRegister.classList.add("right-panel-active");
	signInContainer.classList.add('in')
});

signInButton.addEventListener('click', () => {
	containerRegister.classList.remove("right-panel-active");
	signInContainer.classList.remove('in')
});
