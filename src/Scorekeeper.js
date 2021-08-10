import React, { useState, useEffect } from 'react';
import { useLocation, useHistory } from "react-router-dom";
import { Modal, Button } from 'react-bootstrap';
import firebase from './firebase';
import smallDiamond from './assets/smallDiamond.svg';
import ScoringModal from './ScoringModal';


export default function Scorekeeper() {
    const location = useLocation();
    const history = useHistory();
    const [array, setArray] = useState(location.state.detail);
    const [colors, setColors] = useState([]);
    const columnNumber = 10;
    const [rowNumber, setRowNumber] = useState(1);
    const [teamRoster, setTeamRoster] = useState([]);
    const [gameRuns, setGameRuns] = useState(location.state.score);

    const backToMain = () => {
        history.push({
            pathname: '/',
            state: { detail: array,
            score: gameRuns }
        })
    }


    // modal functionality
    const [show, setShow] = useState(false);
    const [alertShow, setAlertShow] = useState(false);
    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);
    const handleAlertShow = () => setAlertShow(true);
    const handleAlertClose = () => setAlertShow(false);
    
    // modal states
    const [frame, setFrame] = useState(0);
    const [batter, setBatter] = useState(0);
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
            playerRoster.push(key);
            }
            // call this function to update out component's state to be the new value
            setTeamRoster(playerRoster);
        });

        return () => {
            dbRef.off();
        }
    }, [])

    useEffect(() => {
        const colorCopy = [];
        for (let i = 0; i < array.length; i++) {
            const value = array[i].toString();
            if (value.indexOf("OUT") !== - 1 || value.indexOf("SO") !== - 1) {
                colorCopy.push("btn btn-danger w-100 p-0");
            } else {
                colorCopy.push("btn btn-success w-100 p-0");
            }
            setColors(colorCopy);
        }
    }, [array])

    const gridObj = {
        display: `grid`,
        gridTemplateColumns: `repeat(${columnNumber}, 1fr)`,
        gridTemplateRows: `repeat(${rowNumber}, 1fr)`,
        alignItems: `center`
    }
    
    const addRow = () => {
        const arrayCopy = [...array];
        for (let i = 0; i < columnNumber; i++) {
            if (i % columnNumber === 0) {
                arrayCopy.push('playerName');
            } else {
                arrayCopy.push(0);
            }
        }
        setRowNumber(rowNumber + 1);
        setArray(arrayCopy);
    };

    const showCell = index => {
        const batterValue = Math.floor(index / 10) * 10;
        const batterName = array[batterValue]
        setFrame(index);
        if (batterName === "playerName" || 0) {
            handleAlertShow();
        } else {
            setBatter(array[batterValue]);
            handleShow();
        }
    }

    const changeBatter = (batterName, arrayIndex) => {
        const arrayCopy = [...array];
        arrayCopy.splice(arrayIndex, 1, batterName);
        setArray(arrayCopy);
    }

    const innings = [];

    for (let i = 0; i < 10; i++) {
        if (i === 0) {
            innings.push("Player")
        } else {
            innings.push(i);
        }
    }

    return (
        <>
        <Modal show={alertShow} onHide={handleAlertClose} className="modal modal-lg">
            Please choose a player.
            <Button variant="primary mx-auto w-50" onClick={handleAlertClose}>
                Close
            </Button>
        </Modal>
            <ScoringModal
                frame={frame}
                batter={batter}
                array={array}
                show={show}
                hideModal={handleClose}
                setArray={setArray}
                gameRuns={gameRuns}
                setGameRuns={setGameRuns}
            />
            <div className="score">
                <div className="yourTeam">
                    <p>Your team:</p>
                    <p>{gameRuns}</p>
                </div>
                <div className="otherTeam">
                <p>Other team:</p>
                    <label htmlFor="otherTeamRuns" className="srOnly">Enter the Other team's score</label>
                    <input 
                    type="number" 
                    id="otherTeamRuns"
                    min="0"
                    />
                </div>
            </div>
            <div 
            style={gridObj}
            >
                {
                    innings.map( (inning, index) => {
                        return(
                            <div className="innings" key={index}>{inning}</div>
                        )
                    })
                }   
                {
                    array.map( (frame, index) => {
                        const cellValue =
                        frame === 0 ? null : frame;
                        return(
                            <div 
                            key={index}
                            className="scoreFrame"
                            >
                            {
                            index % 10 === 0 ?

                            <select
                                value={frame}
                                name="playerName" 
                                id="playerName"
                                key={index}
                                onChange={ (e) => changeBatter(e.target.value,index) }
                                >
                                <option value="playerName">
                                    Select
                                </option>
                                    {
                                        teamRoster.map( (player, index) => {
                                            return(
                                                <option 
                                                key={index} 
                                                value={player}
                                                >
                                                    {teamRoster[index]}
                                                </option>
                                            )
                                        })
                                    }
                            </select> 
                            : 
                            <button 
                                key={index}
                                style={{
                                    backgroundImage: `url(${smallDiamond})`, 
                                    backgroundRepeat: `no-repeat`,
                                    backgroundPosition: `center`}}
                                className={colors[index]} 
                                onClick={() => showCell(index)}
                                >
                                {cellValue}
                            </button>
                            }
                            </div>
                        )
                    })  
                }
            </div>
            <button onClick={addRow} className="btn btn-success w-100 mt-3">Add row</button>
            <button onClick={backToMain} className="btn btn-warning w-100 mt-3 mb-3">Back to Main</button>
        </>
    )
}
