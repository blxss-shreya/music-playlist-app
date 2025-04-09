let playlist = []
const local_storage_key = "localStorage"


function getSong() {

    
    //obtain the song by the title entered
    let songName = document.getElementById('song').value
    if(songName === '') {
        return alert('Please enter a song: ');
    }

    let songDiv = document.getElementById('songname');  

    document.querySelector("#matchingSongs tbody").innerHTML = '';
    

    //send http request to obtain all matching songs with the given title
    let xhr = new XMLHttpRequest()
    xhr.onreadystatechange = () => {
        if (xhr.readyState == 4 && xhr.status == 200) {
            //parse the response obtained from the http request
            let response = JSON.parse(xhr.responseText);
            console.log(response); // Debugging: check if response is structured correctly
            if (!response.results || response.results.length === 0) {//check if a valid repsonse exists
                songDiv.innerHTML = `<h1>No results found for "${songName}"</h1>`;
                return;
            }

            songDiv.innerHTML = `<h2>Songs matching: ${songName}</h2>`;
            //Add the first 20 matching songs obtained from the http request to iTunes
            for (let i = 0; i < 20; i++){
                let songData = response.results[i];
                addingMatchingSongs(songData);
            }
        }
        //event handler for submit button
        document.getElementById('submit_button').addEventListener('click', getSong);

    };
    xhr.open('GET', `/songs?title=${songName}`, true)
    xhr.send()
}

document.addEventListener('DOMContentLoaded', function() {
    let tableBody = document.querySelector('#adminTable tbody');
});

//function for adding and displaying all songs matching the given title
function addingMatchingSongs(songData) {
    let tableBody = document.querySelector("#matchingSongs tbody");

    let newRow = tableBody.insertRow();
    newRow.innerHTML = `
        <td>
            <button class="add-song">+</button>
        </td>
        <td>${songData.trackName}</td>
        <td>${songData.artistName}</td>
        <td><img src="${songData.artworkUrl100}" width="50"></td>
    `;
}

//Function for adding a song to playlist by pressing add button and displaying it on playlist
function addSongToPlaylist(songData) {
    playlist.push(songData);
    savePlaylistToLocalStorage()

    let tableBody = document.querySelector("#playlistTable tbody");
    let newRow = tableBody.insertRow();
    newRow.innerHTML = `
        <td>
            <button class="remove-song">-</button>
            <button class="move-up">⬆</button>
            <button class="move-down">⬇</button>
        </td>
        <td>${songData.trackName}</td>
        <td>${songData.artistName}</td>
        <td><img src="${songData.artworkUrl100}" width="50"></td>
    `;

    
}
//function to save the current playlist to local storage
function savePlaylistToLocalStorage(){
    localStorage.setItem(local_storage_key, JSON.stringify(playlist));
}
//loads the playlist from the local storage
function loadPlaylistFromLocalStorage(){
    const storedValues = localStorage.getItem(local_storage_key);
    if(storedValues){
        playlist = JSON.parse(storedValues);
        playlist.forEach(songData => {
            let tableBody = document.querySelector("#playlistTable tbody");
            let newRow = tableBody.insertRow();
            newRow.innerHTML = `
                <td>
                    <button class="remove-song">-</button>
                    <button class="move-up">⬆</button>
                    <button class="move-down">⬇</button>
                </td>
                <td>${songData.trackName}</td>
                <td>${songData.artistName}</td>
                <td><img src="${songData.artworkUrl100}" width="50"></td>
            `;
        });
    }
}
//update this new playlist
function updatePlaylistFromTable(){
    const rows = document.querySelectorAll("#playlistTable tbody tr")
    newPlaylist = []
    rows.forEach(row=>{
        const trackName = row.cells[1].innerText
        const artistName = row.cells[2].innerText
        const artworkUrl100 = row.cells[3].querySelector('img').src
        newPlaylist.push({trackName, artistName, artworkUrl100})
    })
    playlist = newPlaylist; 
    savePlaylistToLocalStorage()
}

//function for removing a song from playlist by pressing remove button
function removeSong(row) {
    let trackName = row.cells[1].innerText;
    let artistName = row.cells[2].innerText;
    playlist = playlist.filter(song => !(song.trackName === trackName && song.artistName === artistName));
    savePlaylistToLocalStorage();
    row.parentNode.removeChild(row);
}
//function for moving up a song in a playlist by pressing move up button
function moveUp(event) {
    let row = event.target.closest("tr"); // Get the row of the clicked button
    let prevRow = row.previousElementSibling; // Get the row above

    if (prevRow) {
        row.parentNode.insertBefore(row, prevRow); // Move up
        setTimeout(updatePlaylistFromTable,0); //wait for DOM update
        let i = row.rowIndex-1;
        if(i > 0){
            [playlist[i], playlist[i-1]]=[playlist[i-1], playlist[i]]
            //save to local storage 
            savePlaylistToLocalStorage()
        }
    }
}

//function to move a song down in a playlist by pressing move down button
function moveDown(event) {
    let row = event.target.closest("tr"); // Get the row of the clicked button
    let nextRow = row.nextElementSibling; // Get the row after the current row

    if (nextRow) {
        row.parentNode.insertBefore(nextRow, row); // Move down
        setTimeout(updatePlaylistFromTable,0); //wait for DOM update
        let i = row.rowIndex-1
        if(i < playlist.length-1){
            [playlist[i], playlist[i+1]]=[playlist[i+1], playlist[i]]
            //save to local storage 
            savePlaylistToLocalStorage()
        }
    }
}


const ENTER=13

//event handlers
function handleKeyUp(event) {
event.preventDefault()
   if (event.keyCode === ENTER) {
      document.getElementById("submit_button").click()
  }
}

document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('submit_button').addEventListener('click', getSong);
  //add key handler for the document as a whole, not separate elements.
  document.addEventListener('keyup', handleKeyUp);
  //add playlist from local storage
  loadPlaylistFromLocalStorage();
})

//event handlers in the event of clicking a button
document.addEventListener('click', function(event) {
    let button = event.target;
    let row = button.parentNode.parentNode;

    //if add song button is clicked, obtain the trackName, artistName and image for the song to be added
    // and pass it as a paramter to the add function
    if (button.classList.contains('add-song')){
        let songData = {
            trackName: row.cells[1].innerText,
            artistName: row.cells[2].innerText,
            artworkUrl100: row.cells[3].querySelector('img').src
        }
        addSongToPlaylist(songData);
    }
    //if remove song button is clicked, call remove function
    if(button.classList.contains('remove-song')){
        removeSong(row);
    }
    //if move up song button is clicked, call move up function
    if(button.classList.contains('move-up')){
        moveUp(event);
    }
    //if move down song button is clicked, call move down function
    if(button.classList.contains('move-down')){
        moveDown(event);
    }
});


