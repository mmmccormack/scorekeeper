import React, { useState, useEffect } from 'react';
import firebase from './firebase';
import diamond from './assets/fulldiamond.gif';
import { Link } from 'react-router-dom';

export default function TeamStats() {

  const [teamStatList, setTeamStatList] = useState([]);
  const [playerStatList, setPlayerStatList] = useState([]);
  const [playerHitFreq, setPlayerHitFreq] = useState([]);
  

    // this useEffect is added for establishing a connection to the firebase database anytime the user opens the app or makes changes to the database
    useEffect( () => {
        // establish connection to firebase DB
        const uid = firebase.auth().currentUser.uid;
        const dbRef = firebase.database().ref(`users/${uid}`);
        // add event listener for any time firebase DB changes.
        dbRef.on('value', (res) => {
          // create new variable to store the new state that we want to introduce to our app
          const playerRoster = [];
          // use res.val to store the response from your DB in a useful object chunk
          const data = res.val();
          // iterate using for in loop to get items into array, and to have unique key value assigned to each one
          for (let key in data) {
            playerRoster.push({
                key : key,
              stats : data[key],
            })
          }
          // call this function to update out component's state to be the new value
          setTeamStatList(playerRoster);
        })

        return () => {
          dbRef.off();
        }
      }, [])

      const displayFrequencyColors = (stats) => {
        const displayColors = [];
        for (let i = 1; i < 10; i++) {
          if (stats[i] < 33) {
            displayColors.push('blue');
          } else if (stats[i] >= 34 && stats[i] <= 50) {
            displayColors.push('yellow');
          } else if (stats[i] >= 51 && stats[i] <= 70) {
            displayColors.push('orange');
          } else {
            displayColors.push('red');
          }
        }
        setPlayerHitFreq(displayColors);
      }

      const displayPlayerStats = (player) => {
        const playerStats = [];
        playerStats.push(player.key)
        let totalAreasOnField = 0;
        for (let stat in player.stats) {
          if (stat.length === 1) {
            totalAreasOnField = totalAreasOnField + Number(player.stats[stat]);
          }
        }
        for (let stat in player.stats) {
          if (stat.length === 1) {
            playerStats.push(Math.floor((player.stats[stat] / totalAreasOnField) * 100))
          } else {
            playerStats.push(player.stats[stat])
          }
        }
        
        displayFrequencyColors(playerStats);
        setPlayerStatList(playerStats);
      }



    return (
      <>
        <div className="statsPanel">
          <div className="playerButtonListBox">
            <ul className="teamPlayerList">
              {
                teamStatList.map( (listItem) => {
                    return(
                        <button key={listItem.key} className="btn btn-info w-100 mt-2" onClick={() => displayPlayerStats(listItem)}>{listItem.key}</button>
                    )
                })  
              }
            </ul>
          </div>
          <div>
            <ul className="individualPlayerStats">
              <li>Name: {playerStatList[0]}</li>
              <li>AB: {playerStatList[10]}</li>
              <li>H: {playerStatList[13]}</li>
              <li>1B: {playerStatList[20]}</li>
              <li>2B: {playerStatList[12]}</li>
              <li>3B: {playerStatList[23]}</li>
              <li>HR: {playerStatList[14]}</li>
              <li>BB: {playerStatList[24]}</li>
              <li>SO: {playerStatList[22]}</li>
              <li>AVG: {isNaN(playerStatList[11]) ? "0.000" : playerStatList[11]}</li>
              <li>OBP: {isNaN(playerStatList[15]) ? "0.000" : playerStatList[15]}</li>
              <li>SLG: {isNaN(playerStatList[21]) ? "0.000" : playerStatList[21]}</li>
              <li>OPS: {isNaN(Number(playerStatList[15]) + Number(playerStatList[21])) ? "0.000" : (Number(playerStatList[15]) + Number(playerStatList[21])).toFixed(3)}</li>
            </ul>
          </div>
        </div>
        <div className="diamond">
          <img src={diamond} alt="A baseball diamond." />
          <div className={`pos pitcher ${playerHitFreq[0]}`}>{isNaN(playerStatList[1]) ? null : `${playerStatList[1]}%`}</div>
          <div className={`pos catcher ${playerHitFreq[1]}`}>{isNaN(playerStatList[2]) ? null : `${playerStatList[2]}%`}</div>
          <div className={`pos firstbase ${playerHitFreq[2]}`}>{isNaN(playerStatList[3]) ? null : `${playerStatList[3]}%`}</div>
          <div className={`pos secondbase ${playerHitFreq[3]}`}>{isNaN(playerStatList[4]) ? null : `${playerStatList[4]}%`}</div>
          <div className={`pos thirdbase ${playerHitFreq[4]}`}>{isNaN(playerStatList[5]) ? null : `${playerStatList[5]}%`}</div>
          <div className={`pos shortstop ${playerHitFreq[5]}`}>{isNaN(playerStatList[6]) ? null : `${playerStatList[6]}%`}</div>
          <div className={`pos leftfield ${playerHitFreq[6]}`}>{isNaN(playerStatList[7]) ? null : `${playerStatList[7]}%`}</div>
          <div className={`pos centerfield ${playerHitFreq[7]}`}>{isNaN(playerStatList[8]) ? null : `${playerStatList[8]}%`}</div>
          <div className={`pos rightfield ${playerHitFreq[8]}`}>{isNaN(playerStatList[9]) ? null : `${playerStatList[9]}%`}</div>
        </div>
        <Link to="/" className="btn btn-warning w-100 mt-3 mb-3">Back to Main</Link>
      </>
    )
}
