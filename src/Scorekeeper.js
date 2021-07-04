import React, { useState, useEffect } from 'react';
import { Button, Modal } from 'react-bootstrap';
import { Link } from "react-router-dom";
import firebase from './firebase';
import smallDiamond from './assets/smallDiamond.svg';
import diamond from './assets/fulldiamond.gif';


export default function Scorekeeper() {

    const [array, setArray] = useState(["playerName",0,0,0,0,0,0,0,0,0]);
    const columnNumber = 10;
    const [rowNumber, setRowNumber] = useState(1);
    const [teamRoster, setTeamRoster] = useState([]);
    const [gameRuns, setGameRuns] = useState(0);

    // modal functionality
    const [show, setShow] = useState(false);
    const handleClose = () => {
        setShow(false);
        setResult("");
        setLocation("");
    };
    const handleShow = () => setShow(true);
    const handleHide = () => setShow(false);
    // modal states
    const [frame, setFrame] = useState(0);
    const [batter, setBatter] = useState(0);
    const [location, setLocation] = useState("");
    const [result, setResult] = useState("");



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
    }, [])

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

    // when score frame is clicked:
    // - get array index
    // - get player name
    const showCell = index => {
        const batterValue = Math.floor(index / 10) * 10;
        setFrame(index);
        setBatter(array[batterValue]);
        handleShow();
    }

    const changeBatter = (batterName, arrayIndex) => {
        const arrayCopy = [...array];
        arrayCopy.splice(arrayIndex, 1, batterName);
        setArray(arrayCopy);
    }

    const handleCorrection = (frameResult) => {
        const arrayCopy = [...array];
        // take outcome from frame and split it
        const previousResult = arrayCopy[frameResult].split(" - ");
        const previousLocation = previousResult[1].split(",");
        const uid = firebase.auth().currentUser.uid;
        const dbRef = firebase.database().ref(`users/${uid}/${batter}`);
        const update = {};
        dbRef.on(`value`, response => {
            if (previousLocation[1] === " R") {
                update.runs = Number(response.val().runs) - 1;
                setGameRuns(gameRuns - 1);
            }
        // update any affected fields
        // DRAW RESULT AND FUNCTION AS ARGUMENTS INTO THE FUNCTION
            if (previousResult[0] === "1B" || previousResult[0] === "2B" || previousResult[0] === "3B" || previousResult[0] === "HR") {
                update.hits = Number(response.val().hits) - 1;
                update.atbats = Number(response.val().atbats) - 1;
                update[previousLocation[0]] = Number(response.val()[previousLocation[0]]) - 1;
                if (previousResult[0] === "1B") {
                    update.singles = Number(response.val().singles) - 1;
                } else if (previousResult[0] === "2B") {
                    update.doubles = Number(response.val().doubles) - 1;
                } else if (previousResult[0] === "3B") {
                    update.triples = Number(response.val().triples) - 1;
                } else if (previousResult[0] === "HR") {
                    update.homeruns = Number(response.val().homeruns) - 1;
                    update.runs = Number(response.val().runs) - 1;
                    setGameRuns(gameRuns - 1);
                }
            }
            if (previousResult[0] === "BB") {
                update.walks = Number(response.val().walks) - 1;
            }
            if (previousResult[0] === "SAC") {
                update.sacs = Number(response.val().sacs) - 1;
                if (previousLocation[0] !== "") {
                    update[previousLocation[0]] = Number(response.val()[previousLocation[0]]) - 1;
                }
            }
            if (previousResult[0] === "SO" || previousResult[0] === "OUT") {  
                update.atbats = Number(response.val().atbats) - 1;
                if (previousResult[0] === "SO") {
                    update.strikeouts = Number(response.val().strikeouts) - 1;
                } else if (previousResult[0] === "OUT" && previousLocation[0] !== "") {
                    update.outs = Number(response.val().outs) - 1;
                    update[previousLocation[0]] = Number(response.val()[previousLocation[0]]) - 1;
                } else {
                    update.outs = Number(response.val().outs) - 1;
                }
            }
            if (previousResult[1] === "OUT") {
                update.outs = Number(response.val().outs) - 1;
            }
                // update all percentage values
            update.avg = (Number(response.val().hits) / Number(response.val().atbats)).toFixed(3);
            update.obp = ((Number(response.val().hits) + Number(response.val().walks)) / (Number(response.val().atbats) + Number(response.val().walks) + Number(response.val().sacs))).toFixed(3);
            update.slg = ((Number(response.val().singles) + (Number(response.val().doubles) * 2) + (Number(response.val().triples) * 3) + (Number(response.val().homeruns) * 4)) / Number(response.val().atbats)).toFixed(3);
            update.ops = (Number(update.slg) + Number(update.obp)).toFixed(3);
            
        });
        dbRef.off();
        dbRef.update(update)
        setResult("");
        setLocation("");
        // reset array value to zero so new modal can be displayed
        arrayCopy[frameResult] = 0;
        setArray(arrayCopy);
    }

    const handleScoring = (frameResult) => {
        const arrayCopy = [...array];
        // if the index in the array already has scoring content in it, add ot the end
        if (typeof arrayCopy[frameResult] === "string") {
            arrayCopy[frameResult] = `${arrayCopy[frameResult]}, ${result}`;
        // if not, add the new outcome to the array index
        } else {
            arrayCopy[frameResult] = `${result} - ${location}`;
        }
        setArray(arrayCopy);
        updateStats();
        handleHide();
    }

    const updateStats = () => {
        const uid = firebase.auth().currentUser.uid;
        const dbRef = firebase.database().ref(`users/${uid}/${batter}`);
        const update = {};
        dbRef.on(`value`, response => {
        // update any affected fields
        // DRAW RESULT AND FUNCTION AS ARGUMENTS INTO THE FUNCTION
            if (result === "1B" || result === "2B" || result === "3B" || result === "HR") {
                update.hits = Number(response.val().hits) + 1;
                update.atbats = Number(response.val().atbats) + 1;
                update[location] = Number(response.val()[location]) + 1;
                if (result === "1B") {
                    update.singles = Number(response.val().singles) + 1;
                } else if (result === "2B") {
                    update.doubles = Number(response.val().doubles) + 1;
                } else if (result === "3B") {
                    update.triples = Number(response.val().triples) + 1;
                } else if (result === "HR") {
                    update.homeruns = Number(response.val().homeruns) + 1;
                    update.runs = Number(response.val().runs) + 1;
                    setGameRuns(gameRuns + 1);
                }
            }
            if (result === "BB") {
                update.walks = Number(response.val().walks) + 1;
            }
            if (result === "SAC") {
                update.sacs = Number(response.val().sacs) + 1;
                if (location !== "") {
                    update[location] = Number(response.val()[location]) + 1;
                }
            }
            if (result === "SO" || result === "OUT") {  
                update.atbats = Number(response.val().atbats) + 1;
                if (result === "SO") {
                    update.strikeouts = Number(response.val().strikeouts) + 1;
                } else if (result === "OUT" && location !== "") {
                    update.outs = Number(response.val().outs) + 1;
                    update[location] = Number(response.val()[location]) + 1;
                } else {
                    update.outs = Number(response.val().outs) + 1;
                }
            }
            if (result === "R") {
                update.runs = Number(response.val().runs) + 1;
                setGameRuns(gameRuns + 1);
            }
                // update all percentage values
            update.avg = (Number(response.val().hits) / Number(response.val().atbats)).toFixed(3);
            update.obp = ((Number(response.val().hits) + Number(response.val().walks)) / (Number(response.val().atbats) + Number(response.val().walks) + Number(response.val().sacs))).toFixed(3);
            update.slg = ((Number(response.val().singles) + (Number(response.val().doubles) * 2) + (Number(response.val().triples) * 3) + (Number(response.val().homeruns) * 4)) / Number(response.val().atbats)).toFixed(3);
            update.ops = (Number(update.slg) + Number(update.obp)).toFixed(3);
            
        });
        dbRef.off();
        dbRef.update(update)
        setResult("");
        setLocation("");
    }


    return (
        <>
            <Modal show={show} onHide={handleClose}>
                <Modal.Header>
                    <Modal.Title>{batter}, Inning {frame % 10}</Modal.Title>
                </Modal.Header>
                { 
                array[frame] === 0 ? 
                <Modal.Body>Select an area on the field where the ball was hit, and a button for what happened. Then, press "Save Result".
                <div className="modalGrid">
                    <div className="diamondModal">
                        <img src={diamond} alt="A baseball diamond." />
                        <button className="pos pitcher scoreScreen" onClick={() => setLocation("1")}>P</button>
                        <button className="pos catcher scoreScreen" onClick={() => setLocation("2")}>C</button>
                        <button className="pos firstbase scoreScreen" onClick={() => setLocation("3")}>1B</button>
                        <button className="pos secondbase scoreScreen" onClick={() => setLocation("4")}>2B</button>
                        <button className="pos thirdbase scoreScreen" onClick={() => setLocation("5")}>3B</button>
                        <button className="pos shortstop scoreScreen" onClick={() => setLocation("6")}>SS</button>
                        <button className="pos leftfield scoreScreen" onClick={() => setLocation("7")}>LF</button>
                        <button className="pos centerfield scoreScreen" onClick={() => setLocation("8")}>CF</button>
                        <button className="pos rightfield scoreScreen" onClick={() => setLocation("9")}>RF</button>
                    </div>
                    <div className="resultsModal">
                    <Button variant="primary m-1" onClick={() => setResult("1B")}>
                        Single
                    </Button>
                    <Button variant="primary m-1" onClick={() => setResult("2B")}>
                        Double
                    </Button>
                    <Button variant="primary m-1" onClick={() => setResult("3B")}>
                        Triple
                    </Button>
                    <Button variant="primary m-1" onClick={() => setResult("HR")}>
                        HR
                    </Button>
                    <Button variant="primary m-1" onClick={() => setResult("BB")}>
                        BB
                    </Button>
                    <Button variant="primary m-1" onClick={() => setResult("SAC")}>
                        SAC
                    </Button>
                    <Button variant="primary m-1" onClick={() => setResult("SO")}>
                        SO
                    </Button>
                    <Button variant="primary m-1" onClick={() => setResult("OUT")}>
                        OUT
                    </Button>
                    </div>
                    <div className="emptyModal">
                        Result: {result} {location === "" ? null : `to ${location}`}
                    </div>
                </div>
                </Modal.Body> 
                : 
                <Modal.Body>Update your player's outcome for this frame, or select "Correction" to re-score this frame.
                <div className="modalGrid">
                    <div className="diamondModal">
                    </div>
                    <div className="resultsModal">
                        <Button variant="primary m-1" onClick={() => setResult("R")}>
                            R
                        </Button>
                        <Button variant="primary m-1" onClick={() => setResult("OUT")}>
                            OUT
                        </Button>
                    </div>
                    <div className="emptyModal">
                        Result: {result}
                    </div>
                </div>
                </Modal.Body> }
                
                <Modal.Footer>
                    {
                    array[frame] !== 0 ? 
                    <Button variant="warning" onClick={() => handleCorrection(frame)}>
                    Correction
                    </Button> 
                    : null
                    }
                
                <Button variant="danger" onClick={handleClose}>
                    Close
                </Button>
                <Button variant="success" onClick={() => handleScoring(frame, result)}>
                    Save Result
                </Button>
                </Modal.Footer>
            </Modal>
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
                                name="playerName" 
                                id="playerName"
                                key={index}
                                onChange={ (e) => changeBatter(e.target.value,index) }
                                >
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
                                className="btn btn-success w-100" 
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
            <Link to="/" className="btn btn-warning w-100 mt-3 mb-3">Back to Main</Link>
        </>
    )
}
