import React, { useState, useRef } from "react";
import Queue from "./Queue";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlay, faPause } from "@fortawesome/free-solid-svg-icons";
import db from "./firebaseConfig";
import Volume from "./Volume.js";
import Spotify from "spotify-web-api-js";
const spotifyWebApi = new Spotify();

function ChooseSong({
  setUsertype,
  partyName,
  searchHandler,
  queryHandler,
  nowPlaying,
  currentAlbumArt,
  currentTrack,
  currentArtist,
  token,
  deviceId,
  uri,
  position,
  sResults,
  resultsToggle,
  avatar,
  displayName,
  activeListeners,
}) {
  //add to queue
  const [queue, setQueue] = useState([]);
  const errHandler = (err) => {
    console.log("Unable to load song");
    console.log(err);
  };
  const addToQueue = (trackURI) => {
    return fetch(`https://api.spotify.com/v1/me/player/queue?uri=${trackURI}`, {
      method: "POST",
      headers: {
        Authorization: "Bearer " + token,
      },
    })
      .then((res) => res.json())
      .then((res) => {
        console.log(res, "addToQueue response");
      })
      .catch(errHandler);
  };
  //end of add queue logic

  //play pause icon display toggle
  const playIcon = useRef();
  const pauseIcon = useRef();
  const listenersNum = useRef();
  const searchResults = useRef();
  const rightSide = useRef();

  //get listeners
  const playRoomListeners = activeListeners.filter((obj) => {
    return obj.id === deviceId;
  });
  const numListeners = playRoomListeners.length;

  return (
    <div className={"search-page-page"}>
      <header className="room-choice-header">
        <h1
          className="logo"
          onClick={() => {
            spotifyWebApi.setAccessToken(token);
            spotifyWebApi.pause().then((res) => console.log("pause", res));
            setUsertype("none");
            db.collection("room").doc(deviceId).update({
              pause: true,
            });
          }}
        >
          Play.All(▶)
        </h1>
        <div className="avatar-displayname">
          <img src={avatar}></img>
          <p>{displayName}</p>
        </div>
      </header>
      <h1>You are the host of {partyName}</h1>
      <div className={"search-page"}>
        <p>
          Search for a song to play or connect and play directly from Spotify
        </p>
        <div className={"search-bar-now-playing"}>
          <form onSubmit={searchHandler} className="search">
            <input
              className="searchTerm"
              type="text"
              onChange={queryHandler}
              placeholder="search for a song"
            ></input>
            <input className="searchButton" type="submit" value="🔎"></input>
          </form>

          <div ref={nowPlaying} className={"now-playing"}>
            <img
              className={"rotating"}
              src={currentAlbumArt}
              alt="album-art"
            ></img>
            <p className={"now-playing-text"}>
              {currentTrack} - {currentArtist}
            </p>

            <Volume token={token} />
            <div ref={playIcon} className={"play"}>
              <FontAwesomeIcon
                icon={faPlay}
                size="2x"
                onClick={() => {
                  playIcon.current.style.display = "none";
                  pauseIcon.current.style.display = "block";
                  spotifyWebApi.setAccessToken(token);
                  spotifyWebApi.play({
                    device_id: deviceId,
                    uris: [uri],
                    position_ms: position,
                  });
                }}
              />
            </div>
            <div ref={pauseIcon} className={"pause"}>
              <FontAwesomeIcon
                icon={faPause}
                size="2x"
                onClick={() => {
                  playIcon.current.style.display = "block";
                  pauseIcon.current.style.display = "none";
                  spotifyWebApi.setAccessToken(token);
                  spotifyWebApi
                    .pause()
                    .then((res) => console.log("pause", res));
                }}
              />
            </div>
          </div>

          <div className="split-half-container">
            <div ref={searchResults} className={"search-results"}>
              {sResults !== [] &&
                resultsToggle &&
                sResults.map((track, i) => (
                  <div className={"result"}>
                    <div className={"image-icon"}>
                      <img
                        key={i}
                        alt={"album-art"}
                        src={track.album.images[1].url}
                        onClick={() => {
                          nowPlaying.current.style.display = "flex";
                          listenersNum.current.style.display = "flex";
                          searchResults.current.style.width = "50%";
                          rightSide.current.style.display = "block";
                          spotifyWebApi.setAccessToken(token);
                          spotifyWebApi.play({
                            device_id: deviceId,
                            uris: [track.uri],
                          });
                          queue.push({
                            albumart: track.album.images[1].url,
                            artist: track.artists[0].name,
                            name: track.name,
                          });
                        }}
                      ></img>
                      <FontAwesomeIcon
                        icon={faPlay}
                        size="2x"
                        className={"play-btn"}
                        onClick={() => {
                          nowPlaying.current.style.display = "flex";
                          listenersNum.current.style.display = "flex";
                          searchResults.current.style.width = "50%";
                          rightSide.current.style.display = "block";
                          spotifyWebApi.setAccessToken(token);
                          spotifyWebApi.play({
                            device_id: deviceId,
                            uris: [track.uri],
                          });
                          queue.push({
                            albumart: track.album.images[1].url,
                            artist: track.artists[0].name,
                            name: track.name,
                          });
                        }}
                      />
                    </div>

                    <div className={"result-track-details"}>
                      <p className={"track-title"}>{track.name}</p>
                      <p className={"artist-name"}>{track.artists[0].name}</p>
                    </div>
                    <button
                      className={"que-button"}
                      onClick={() => {
                        addToQueue(track.uri);
                        queue.push({
                          albumart: track.album.images[1].url,
                          artist: track.artists[0].name,
                          name: track.name,
                        });
                      }}
                    >
                      Add to playlist
                    </button>
                  </div>
                ))}
            </div>

            <div className="right-half" ref={rightSide}>
              <div ref={listenersNum} className="num-of-listeners-for-host">
                <h2>{numListeners} listeners</h2>
                {playRoomListeners.map((obj) => (
                  <p>{obj.listener.display_name} 🎧</p>
                ))}
              </div>
              <Queue queue={queue} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChooseSong;
