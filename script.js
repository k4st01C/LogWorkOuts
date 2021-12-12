'use strict';
// prettier-ignore
const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];

//maps
const googleSat = L.tileLayer('http://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
	maxZoom: 20,
	subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
});

const googleTerrain = L.tileLayer('http://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
	maxZoom: 20,
	subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
});

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');
const btnMap = document.querySelector('#btnMap');
const btnReset = document.querySelector('#btnReset');

class Workout {
	date = new Date();
	id = Date.now().toString().slice(-10);
	constructor(distance, duration, coords) {
		this.distance = distance; //in km
		this.duration = duration; //in min
		this.coords = coords;
	}

	_setDescription() {
		this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
			months[this.date.getMonth()]
		} ${this.date.getDate()}
		`;
	}
}

class Running extends Workout {
	type = 'running';
	pace = (this.duration / this.distance).toFixed(1);
	constructor(distance, duration, coords, cadence) {
		super(distance, duration, coords);
		this.cadence = cadence;
		this._setDescription();
	}
}

class Cycling extends Workout {
	type = 'cycling';
	speed = (this.distance / (this.duration / 60)).toFixed(1);
	constructor(distance, duration, coords, elevationGain) {
		super(distance, duration, coords);
		this.elevationGain = elevationGain;
		this._setDescription();
	}
}

class App {
	#map;
	#mapZoomLevel = 13;
	#mapEvent;
	#workouts = [];
	#flag = false;
	constructor() {
		//get location data
		this._getPosition();
		//get workouts array from localstorage
		this._getLocalStorage();
		//attach evenlisteners
		form.addEventListener('submit', this._newWorkOut.bind(this));
		inputType.addEventListener('change', this._toggleElevationField.bind(this));
		btnMap.addEventListener('click', this._changeMap.bind(this));
		btnReset.addEventListener('click', this.reset.bind(this));
		containerWorkouts.addEventListener('click', this._flyTo);
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
		this.#map = L.map('map').setView(coords, this.#mapZoomLevel);
		googleSat.addTo(this.#map);
		this.#map.on('click', this._showForm.bind(this));
		this.#workouts.forEach(e => {
			this._renderWorkoutMarker(e);
		});
	}

	//no need to bind this if you use arrow funcs
	_flyTo = e => {
		const workoutEl = e.target.closest('.workout');
		if (!workoutEl) return;
		const selectedWorkout = this.#workouts.find(e => e.id === workoutEl.dataset.id);
		this.#map.setView(selectedWorkout.coords, this.#mapZoomLevel, {
			animate: true,
			pan: {
				duration: 1,
			},
		});
	};

	_changeMap() {
		this.#flag = !this.#flag;
		if (this.#flag) {
			googleSat.remove();
			googleTerrain.addTo(this.#map);
		} else {
			googleTerrain.remove();
			googleSat.addTo(this.#map);
		}
	}
	_showForm(mapE) {
		form.classList.remove('hidden');
		inputDistance.focus();
		this.#mapEvent = mapE;
	}

	_hideForm() {
		inputDistance.value = inputCadence.value = inputDuration.value = inputElevation.value = '';
		form.classList.add('hidden');
	}
	_toggleElevationField() {
		inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
		inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
	}
	_newWorkOut(e) {
		const { lat, lng } = this.#mapEvent.latlng;
		e.preventDefault();
		//get data from form & data validation
		let workout;
		const type = inputType.value;
		const duration = +inputDuration.value;
		const distance = +inputDistance.value;
		//if workout running, create running object
		if (type === 'running') {
			const cadence = +inputCadence.value;
			if (
				!this._isNumber(cadence, duration, distance) ||
				!this._isPositive(cadence, duration, distance)
			)
				return alert('Entry should be a positive number');
			workout = new Running(distance, duration, [lat, lng], cadence);
		}
		//if workout cycling, create cycling object
		if (type === 'cycling') {
			const elevation = +inputElevation.value;
			if (!this._isNumber(elevation, duration, distance) || !this._isPositive(duration, distance))
				return alert('Entry should be a positive number');
			workout = new Cycling(distance, duration, [lat, lng], elevation);
		}
		//push workout to workouts arr
		this.#workouts.push(workout);
		//render workout on map as marker
		this._renderWorkoutMarker(workout);
		//render workout on list
		this._renderWorkoutList(workout);
		//hide form + clear fields
		this._hideForm();
		//set local storage to all workouts
		this._setLocalStorage();
	}

	_isNumber = (...entries) => entries.every(e => Number.isFinite(e));

	_isPositive = (...entries) => entries.every(e => e > 0);

	_renderWorkoutMarker(workout) {
		L.marker(workout.coords)
			.addTo(this.#map)
			.bindPopup(
				L.popup({
					maxwidt: 250,
					minWidth: 100,
					autoClose: false,
					closeOnClick: false,
					className: `${workout.type}-popup`,
				}),
			)
			.setPopupContent(`${workout.description} ${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'}`)
			.openPopup();
	}

	_renderWorkoutList(workout) {
		let html = `
		<li class="workout workout--${workout.type}" data-id="${workout.id}"> 
        <h2 class="workout__title">${workout.description}</h2>
        <div class="workout__details">
        <span class="workout__icon">${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'}</span>
        <span class="workout__value">${workout.distance}</span>
        <span class="workout__unit">km</span>
        </div>
        <div class="workout__details">
        <span class="workout__icon">⏱</span>
        <span class="workout__value">${workout.duration}</span>
        <span class="workout__unit">min</span>
        </div>`;

		if (workout.type === 'running') {
			html += `
			<div class="workout__details">
        <span class="workout__icon">⚡️</span>
        <span class="workout__value">${workout.cadence}</span>
        <span class="workout__unit">min/km</span>
        	</div>
			<span class="workout__icon">🦶🏼</span>
			<div class="workout__details">
        <span class="workout__value">${workout.pace}</span>
        <span class="workout__unit">spm</span>
        	</div>
    </li>
			`;
		} else {
			html += `
		<div class="workout__details">
        <span class="workout__icon">⚡️</span>
        <span class="workout__value">${workout.speed}</span>
        <span class="workout__unit">km/h</span>
        </div>
        <div class="workout__details">
        <span class="workout__icon">⛰</span>
        <span class="workout__value">${workout.elevationGain}</span>
        <span class="workout__unit">m</span>
        </div>
    </li>
			`;
		}

		form.insertAdjacentHTML('afterend', html);
	}

	_setLocalStorage() {
		localStorage.setItem('workouts', JSON.stringify(this.#workouts));
	}

	_getLocalStorage() {
		const data = JSON.parse(localStorage.getItem('workouts'));
		if (!data) return;
		this.#workouts = data;
		//list workouts
		this.#workouts.forEach(e => {
			this._renderWorkoutList(e);
		});
	}

	reset() {
		localStorage.removeItem('workouts');
		location.reload();
	}
}

const app = new App();

//test
