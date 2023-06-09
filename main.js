import './style.css';
import * as tf from '@tensorflow/tfjs';

//MODEL GLOBAL VARIABLES
let model; // for tensorflow to use for classification
let highestPrediction; //used for making recipe api call

const CLASS_NAMES = ['Apple', 'Banana', 'Carrot', 'Onion', 'Orange', 'Potato', 'Watermelon']; //array for labels from training model

//MODEL
const MODEL_URL = 'model/model.json'; // trained model location
// Loading the model from local folder
(async function () {
	model = await tf.loadGraphModel(MODEL_URL);
	console.log('Model loaded successfully');
})();

//IMAGE UPDATE SECTION
// Get the video and canvas elements
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const context = canvas.getContext('2d');

// Function to take a photo from the video stream and show it in the canvas
function takePhoto() {
	context.drawImage(video, 0, 0, canvas.width, canvas.height);
	const dataUrl = canvas.toDataURL();
	const previewImage = document.getElementById('frame-preview');
	previewImage.src = dataUrl;
}

// Take a photo when the "Take photo" button is clicked
const takePhotoButton = document.getElementById('videoImageBtn');
takePhotoButton.addEventListener('click', () => {
	takePhoto();
});

// Preview the uploaded image
function preview(input) {
	const previewImage = document.getElementById('frame-preview');
	const imageFile = input.files[0];
	if (imageFile) {
		previewImage.src = URL.createObjectURL(imageFile);
	}
}

// Change the preview when new image is uploaded
const imageUpload = document.getElementById('frame');
imageUpload.addEventListener('change', function () {
	preview(this);
});

//IMAGE CLASSIFICATION
//classify image function
async function classifyImage() {
	// Clear previous results
	const resultList = document.getElementById("resultList");
	resultList.innerHTML = "";
	// Get a reference to the image input field and result paragraph
	const imageUpload = document.getElementById('frame');

	// Check if an image has been uploaded
	if (imageUpload.files && imageUpload.files[0]) {
		// Create a URL for the uploaded image
		const imageUrl = URL.createObjectURL(imageUpload.files[0]);
		imageUpload.value = '';
		// Load the image into an HTMLImageElement using a Promise
		const image = await new Promise(resolve => {
			const img = new Image();
			img.onload = () => resolve(img);
			img.src = imageUrl;
		});

		// Convert the image to a tensor
		const tensor = tf.browser.fromPixels(image).resizeNearestNeighbor([224, 224]).toFloat().expandDims();

		// Run the tensor through the model to get the predictions
		const predictions = await model.predict(tensor).data();

		// Display the predictions
		const output = Array.from(predictions)
			.map((p, i) => ({
				probability: p,
				className: CLASS_NAMES[i]
			}))
			.sort((a, b) => b.probability - a.probability)
			.slice(0, 6);

		// Get the ul element to add the list items to
		const resultList = document.getElementById("resultList");
		const cMessage = document.getElementById("cMessage")

		// Clear existing results
		resultList.innerHTML = "";
		cMessage.innerHTML = "";

		// Create a html element for prediction and add it to the webpage
		highestPrediction = output[0];
		const listItem = document.createElement("p");
		listItem.innerHTML = ` I think its a ${highestPrediction.className} and I'm ${(highestPrediction.probability * 100).toFixed(2)}% Confident`;
		if (highestPrediction.className === CLASS_NAMES[6]) {
			cMessage.innerHTML = 'Look Charlotte, it\'s a watermelon just for you!';
		}
		resultList.appendChild(listItem);
		console.log(highestPrediction);
	}
	else {
		// Load the canvas image into an HTMLImageElement using a Promise
		const image = await new Promise(resolve => {
			const img = new Image();
			img.onload = () => resolve(img);
			img.src = canvas.toDataURL("image/png");
		});

		// Convert the image to a tensor
		const tensor = tf.browser.fromPixels(image).resizeNearestNeighbor([224, 224]).toFloat().expandDims();

		// Run the tensor through the model to get the predictions
		const predictions = await model.predict(tensor).data();

		// Display the predictions
		const output = Array.from(predictions)
			.map((p, i) => ({
				probability: p,
				className: CLASS_NAMES[i]
			}))
			.sort((a, b) => b.probability - a.probability)
			.slice(0, 6);

		// Get the ul element to add the list items to
		const resultList = document.getElementById("resultList");
		const cMessage = document.getElementById("cMessage")

		// Clear any existing results
		resultList.innerHTML = "";
		cMessage.innerHTML = "";

		// Create a html element for prediction and add it to the webpage
		highestPrediction = output[0];
		const listItem = document.createElement("h1");
		listItem.innerHTML = ` I think its a ${highestPrediction.className} and I'm ${(highestPrediction.probability * 100).toFixed(2)}% Confident`;

		if (highestPrediction.className === CLASS_NAMES[6]) {
			cMessage.innerHTML = 'Look Charlotte, it\'s a watermelon just for you!';
		}

		resultList.appendChild(listItem);
		console.log(highestPrediction);
	}

}

// Submit button to classify image
const form = document.querySelector('form');
form.addEventListener('submit', function (event) {
	event.preventDefault();
	classifyImage();
});

//RECIPE API
const searchButton = document.getElementById('search-recipe-btn'); // pull recipe API search button from html element

// API search function
function recipeSearch() {

	// API search credentials
	const appId = '1da8e149';
	const appKey = 'feea1b4350581e419244dcd50105957e';
	// diet options
	const diet = document.getElementById('search-diet').value;
	// mealtype values
	const mealTypeSelect = document.getElementById('search-meal-type').value;
	// cuisine options
	const cuisineType = document.getElementById('search-cuisine-type').value;

	// api request link. set as a let so value can be changed
	let endpoint = `https://api.edamam.com/api/recipes/v2?type=public&q=${highestPrediction.className}&app_id=${appId}&app_key=${appKey}&from=0&to=30&field=label&field=image&field=mealType&field=url&field=totalTime&field=calories`;

	// if statements that allow options to be included in endpoint search. if user doesnt choose an option it won't add the option into the endpoint.
	if (diet !== '') {
		endpoint += `&diet=${diet}`;
	}
	if (mealTypeSelect !== '') {
		endpoint += `&mealType=${mealTypeSelect}`;
	}
	if (cuisineType !== '') {
		endpoint += `&cuisineType=${cuisineType}`;
	}

	fetch(endpoint)
		.then(response => response.json())
		.then(data => {
			const results = data.hits;
			console.group(results);
			let recipeList = document.getElementById('recipeList');

			recipeList.innerHTML = ''; // Clear any existing results

			// Display the recipe results within for each look
			results.forEach(recipe => {
				const recipeName = recipe.recipe.label;
				const recipeImage = recipe.recipe.image;
				const recipeMealType = recipe.recipe.mealType;
				const recipeLink = recipe.recipe.url;
				const recipeTotalTime = recipe.recipe.totalTime;
				const recipeCalories = recipe.recipe.calories;

				const listItem = document.createElement('div');
				listItem.innerHTML = `   
				 <div class="bg-white rounded-md overflow-hidden relative shadow-md max-h-fit">
				   <div>
				     <img class="w-full" src="${recipeImage}" alt="${recipeName}">
				   </div>
				   <div class="p-4 ">
				     <h2 class="text-2xl text-blue-800">${recipeName}</h2>
				     <div class="flex justify-between mt-4 mb-4 text-gray-500">
				       <div class="flex items-center">
				         <span class="ml-1 lg:text-xl">${recipeTotalTime} Mins </span>
				       </div>
				       <div class="flex items-center">
				         <span class="ml-1 lg:text-xl">${recipeMealType}</span>
				       </div>
				       <div class="flex items-center">
				         <span class="ml-1 lg:text-xl">Calories: ${recipeCalories.toFixed(0)}</span>
				       </div>
				     </div>
				     <div class="text-center mt-10">
				       <a href="${recipeLink}" target="_blank" class="mb-5 px-1 py-2 bg-white text-blue rounded-lg shadow-lg tracking-wide  border border-blue cursor-pointer hover:bg-blue hover:text-blue-500">View Recipe</a>
				     </div>
				   </div>
				 </div>
			
                `;

				recipeList.appendChild(listItem);
			});
		})
		.catch(error => console.log(error));
}
//recipe search button
searchButton.addEventListener('click', function () {
	// Check if highestPrediction has been set
	if (!highestPrediction) {
		console.log('Prediction not available');
		return;
	}
	recipeSearch();
});

//VIDEO STREAM SECTION
(() => {

	const width = 500; // We will scale the photo width to this
	let height = 0; // This will be computed based on the input stream

	// Streaming indicates whether or not we're currently streaming video from the camera
	let streaming = false;

	let video = null;
	let canvas = null;
	let photo = null;
	let videoImageBtn = null;

	function startup() {

		video = document.getElementById("video");
		canvas = document.getElementById("canvas");
		photo = document.getElementById("photo");
		videoImageBtn = document.getElementById("videoImageBtn");

		// getUsermedia parameters for video.
		const constraints = {
			video: {
				facingMode: {
					ideal: "environment"
				},
			}
		};
		navigator.mediaDevices.getUserMedia(constraints)
			.then((stream) => {
				video.srcObject = stream;
				video.play();
			})
			.catch((err) => {
				console.error(`An error occurred: ${err}`);
			});

		video.addEventListener(
			"canplay",
			() => {
				if (!streaming) {
					height = video.videoHeight / (video.videoWidth / width);

					// Firefox currently has a bug where the height can't be read from the video, so we will make assumptions if this happens.

					if (isNaN(height)) {
						height = width / (4 / 3);
					}
					video.setAttribute("width", width);
					video.setAttribute("height", height);
					canvas.setAttribute("width", width);
					canvas.setAttribute("height", height);
					streaming = true;
				}
			},
			false
		);

		videoImageBtn.addEventListener(
			"click",
			(ev) => {
				ev.preventDefault();
			},
			false
		);

	}

	// Set up our event listener to run the startup process once loading is complete.
	window.addEventListener("load", startup, false);
})();