import React from "react";
import { makeStyles } from "@material-ui/core/styles";
import IconButton from "@material-ui/core/IconButton";
import DeleteIcon from "@material-ui/icons/Delete";

const useStyles = makeStyles((theme) => ({
  root: {
    "& > *": {
      margin: theme.spacing(1),
    },
  },
}));

function Queue({ queue }) {
  //material UI styles
  const classes = useStyles();

  if (queue.length > 0) {
    return (
      <div className={"queue"}>
        <h2>Playlist</h2>
        {queue.map((track, index) => (
          <div key={index} className={"queue-item"}>
            <img className="que-img" src={track.albumart} alt="album-art"></img>
            <p>
              {track.name} - {track.artist}
            </p>
            <div className={classes.root}>
              <IconButton aria-label="delete">
                <DeleteIcon
                  onClick={() => {
                    queue.splice(index, 1);
                  }}
                />
              </IconButton>
            </div>
          </div>
        ))}
      </div>
    );
  }
  return null;
}

export default Queue;

// import React from "react";
// import { makeStyles } from "@material-ui/core/styles";
// import IconButton from "@material-ui/core/IconButton";
// import DeleteIcon from "@material-ui/icons/Delete";
// import AlarmIcon from "@material-ui/icons/Alarm";
// import AddShoppingCartIcon from "@material-ui/icons/AddShoppingCart";

// const useStyles = makeStyles((theme) => ({
//   root: {
//     "& > *": {
//       margin: theme.spacing(1),
//     },
//   },
// }));

// export default function IconButtons() {
//   const classes = useStyles();

//   return (
//     <div className={classes.root}>
//       <IconButton aria-label="delete">
//         <DeleteIcon />
//       </IconButton>
//       <IconButton aria-label="delete" disabled color="primary">
//         <DeleteIcon />
//       </IconButton>
//       <IconButton color="secondary" aria-label="add an alarm">
//         <AlarmIcon />
//       </IconButton>
//       <IconButton color="primary" aria-label="add to shopping cart">
//         <AddShoppingCartIcon />
//       </IconButton>
//     </div>
//   );
// }
