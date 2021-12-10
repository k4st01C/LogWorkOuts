'use strict';

const months = [
	'January',
	'February',
	'March',
	'April',
	'May',
	'June',
	'July',
	'August',
	'September',
	'October',
	'November',
	'December',
];

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class Workout {
	constructor(distance, duration, coords) {
		this.distance = distance;
		this.duration = duration;
		this.coords = coords;
	}
}

class Running extends Workout {
	constructor(distance, duration, coords, cadence, pace) {
		super(distance, duration, coords);
		this.cadence = cadence;
		this.pace = pace;
	}
}

class Cycling extends Workout {
	constructor(distance, duration, coords, elevationGain, speed) {
		super(distance, duration, coords);
		this.elevationGain = elevationGain;
		this.speed = speed;
	}
}

class App {
	#map;
	#mapEvent;
	constructor() {
		this._getPosition();
		form.addEventListener('submit', this._newWorkOut.bind(this));
		inputType.addEventListener('change', this._toggleElevationField.bind(this));
	}
	_getPosition() {
		if (navigator.geolocation) {
			navigator.geolocation.getCurrentPosition(this._loadMap.bind(this), () =>
				alert('Could not retrieve position'),
			);
		}
	}
	_loadMap(position) {
		const { latitude } = position.coords;
		const { longitude } = position.coords;
		const coords = [latitude, longitude];
		this.#map = L.map('map').setView(coords, 13);
		L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
			attribution:
				'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
		}).addTo(this.#map);
		this.#map.on('click', this._showForm.bind(this));
	}
	_showForm(mapE) {
		form.classList.remove('hidden');
		inputDistance.focus();
		this.#mapEvent = mapE;
		console.log(this.#mapEvent);
	}
	_toggleElevationField() {
		inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
		inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
	}
	_newWorkOut(e) {
		e.preventDefault();
		const { lat, lng } = this.#mapEvent.latlng;
		//clear fields
		inputDistance.value = inputCadence.value = inputDuration.value = inputElevation.value = '';
		//show marker
		L.marker([lat, lng])
			.addTo(this.#map)
			.bindPopup(
				L.popup({
					maxwidt: 250,
					minWidth: 100,
					autoClose: false,
					closeOnClick: false,
					className: 'running-popup',
				}),
			)
			.setPopupContent('Running')
			.openPopup();
	}
}

const app = new App();
