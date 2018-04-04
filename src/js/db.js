import firebase from '@firebase/app';
import '@firebase/database';
import generateID from './generate-id';
import checkStorage from './check-storage';

let firebaseApp = null;
let firebaseDB = null;
let userData = {};
let connected = false;

const hasStorage = checkStorage('localStorage');

function getDay() {
	return userData.day;
}

function getGuess() {
	return userData.guess;
}

function setupUserData() {
	if (hasStorage) {
		let id = window.localStorage.getItem('pudding_birthday_id');
		if (!id) {
			id = generateID();
			window.localStorage.setItem('pudding_birthday_id', id);
		}

		let day = window.localStorage.getItem('pudding_birthday_day');
		day = day ? +day : null;

		let guess = window.localStorage.getItem('pudding_birthday_guess');
		guess = guess ? +guess : null;

		return { id, day, guess };
	}

	const newID = generateID();
	window.localStorage.setItem('pudding_birthday_id', newID);
	return { day: null, guess: null, id: newID };
}

function connect() {
	// Initialize Firebase
	const config = {
		apiKey: 'AIzaSyB3yAZTBNwiZjBIXRFCR4Kb_VZcTiXluiE',
		authDomain: 'birthday-5498b.firebaseapp.com',
		databaseURL: 'https://birthday-5498b.firebaseio.com',
		projectId: 'birthday-5498b'
	};
	firebaseApp = firebase.initializeApp(config);
	firebaseDB = firebaseApp.database();
	connected = true;
}

function exists() {
	return typeof userData.day === 'number' && typeof userData.guess === 'number';
}

function clear() {
	localStorage.removeItem('pudding_birthday_id');
	localStorage.removeItem('pudding_birthday_day');
	localStorage.removeItem('pudding_birthday_guess');
}

function setup() {
	clear();
	userData = setupUserData();
	if (!exists()) connect();
	// console.log(userData);
}

function closeConnection() {
	if (connected)
		firebaseApp.delete().then(() => {
			connected = false;
		});
}

function update({ key, value }) {
	userData[key] = value;
	if (hasStorage) window.localStorage.setItem(`pudding_birthday_${key}`, value);
	const { day, guess, id } = userData;
	if (connected) {
		firebaseDB
			.ref(id)
			.set({ day, guess })
			.then(() => {})
			.catch(console.log);
	}
}

export default { setup, update, getDay, getGuess, closeConnection };
