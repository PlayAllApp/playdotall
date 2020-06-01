import React, { useState, useEffect } from "react";
import { makeStyles } from "@material-ui/core/styles";
import Grid from "@material-ui/core/Grid";
import Typography from "@material-ui/core/Typography";
import Slider from "@material-ui/core/Slider";
import VolumeDown from "@material-ui/icons/VolumeDown";
import VolumeUp from "@material-ui/icons/VolumeUp";
import Spotify from "spotify-web-api-js";
const spotifyWebApi = new Spotify();
const SPOTIFY_API_URL_VOLUME =
  "https://api.spotify.com/v1/me/player/volume?volume_percent=";

const useStyles = makeStyles({
  root: {
    width: 200,
  },
});

export default function ContinuousSlider({ token }) {
  const classes = useStyles();
  const [playerVolume, setPlayerVolume] = useState();

  const handleChange = (event, newValue) => {
    setPlayerVolume(newValue);
  };

  //   spotifyWebApi.setAccessToken(token);
  //   spotifyWebApi.setVolume(playerVolume).then()

  const changeVolume = (volume) => {
    return fetch(`${SPOTIFY_API_URL_VOLUME}${volume}`, {
      method: "PUT",
      headers: {
        Authorization: "Bearer " + token,
      },
    });
  };

  useEffect(() => {
    changeVolume(playerVolume);
  }, [playerVolume]);

  return (
    <div className={classes.root}>
      <Typography id="continuous-slider" gutterBottom>
        Volume
      </Typography>
      <Grid container spacing={2}>
        <Grid item>
          <VolumeDown />
        </Grid>
        <Grid item xs>
          <Slider
            defaultValue={30}
            playerVolume={playerVolume}
            onChange={handleChange}
            aria-labelledby="continuous-slider"
          />
        </Grid>
        <Grid item>
          <VolumeUp />
        </Grid>
      </Grid>
    </div>
  );
}
