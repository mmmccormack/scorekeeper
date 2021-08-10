import React, { useState, useEffect, useCallback } from 'react';
import { Button, Modal } from 'react-bootstrap';
import firebase from './firebase';
import diamond from './assets/fulldiamond.gif';

export default function ScoringModal({
    array, batter, frame, show, hideModal, setArray, gameRuns, setGameRuns
}) {
    // setting state variable to keep track of total runs
    // setting state variables for inside modal
    const [location, setLocation] = useState("");
    const [result, setResult] = useState("");
    const [prevRes, setPrevRes] = useState("");
    const [prevLoc, setPrevLoc] = useState("");
    // setting state array for all possible resulting outcomes
    const [stats, setStats] = useState([0,0,0,0,0,0,0,0,0,0]);
    // setting state array for all possible field positions
    const [fieldPositions, setFieldPositions] = useState([0,0,0,0,0,0,0,0,0]);
    // this closes the modal and resets location and results states to empty strings
    const handleClose = () => {
        setLocation("");
        setResult("");
        hideModal();
    }
    // this updates the scorekeeper screen with the results of the at bat.
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
        handleClose();
        updateStats();
    }
    // these handle adding runs to the score, or removing them.
    const runTally = useCallback((inc) => {setGameRuns(gameRuns + inc)},[gameRuns, setGameRuns]);


    const handleCorrection = (frameResult) => {
        const arrayCopy = [...array];
        // take outcome from frame and split it
        const previousResult = arrayCopy[frameResult].split(" - ");
        const previousLocation = previousResult[1].split(",");
        setPrevRes(previousResult[0]);
        setPrevLoc(previousLocation[0]);
        if (previousLocation[1] === " R") {
            runTally(-1);
        }
        // reset array value to zero so new modal can be displayed
        arrayCopy[frameResult] = 0;
        setArray(arrayCopy);
    }

    const updateStats = useCallback(
        (correction = false) => {
            const statsCopy = [0,0,0,0,0,0,0,0,0,0];
        let increment, res, loc;
        if (correction) {
            increment = -1;
            res = prevRes;
            loc = prevLoc;
        } else {
            increment = 1;
            res = result;
            loc = location;
        }
        if (res === "1B" || res === "2B" || res === "3B" || res === "HR") {
            statsCopy[0] = increment;
            statsCopy[1] = increment;
            if (res === "1B") {
                statsCopy[2] = increment;
            } else if (res === "2B") {
                statsCopy[3] = increment;
            } else if (res === "3B") {
                statsCopy[4] = increment;
            } else if (res === "HR") {
                statsCopy[5] = increment;
                runTally(increment);
            }
        } else if (res === "BB") {
            statsCopy[6] = increment;
        } else if (res === "SAC") {
            statsCopy[7] = increment;
        } else if (res === "SO") {
            statsCopy[1] = increment;
            statsCopy[8] = increment;
        } else if (res === "OUT") {
            if (loc !== "") {
                statsCopy[1] = increment;
                statsCopy[9] = increment;
            } else {
                statsCopy[9] = increment;
            }
        } else if (res === "R") {
            runTally(increment);
        }
        
        setStats(statsCopy);
        // for loop to determine which field position to add to in the player's stats
        const fieldCopy = [0,0,0,0,0,0,0,0,0];
        for (let i = 0; i < fieldCopy.length; i++) {
            if (loc === (i + 1).toString()) {
                fieldCopy[i] = increment;
            }
        }
        setFieldPositions(fieldCopy);
        },
    [location, result, prevRes, prevLoc, runTally])

    useEffect(() => {
        if (prevRes !== "" && prevLoc !== "") {
            updateStats(true);
            setPrevRes("");
            setPrevLoc("");
        }
    }, [prevRes, prevLoc, updateStats, runTally])

    useEffect(() => {
        const uid = firebase.auth().currentUser.uid;
        const dbRef = firebase.database().ref(`users/${uid}/${batter}`);
        const update = {};
        dbRef.on(`value`, data => {
            if (data.val() !== null) {
                // update stats
                update.hits = +(data.val().hits) + stats[0];
                update.atbats = +(data.val().atbats) + stats[1];
                update.singles = +(data.val().singles) + stats[2];
                update.doubles = +(data.val().doubles) + stats[3];
                update.triples = +(data.val().triples) + stats[4];
                update.homeruns = +(data.val().homeruns) + stats[5];
                update.walks = +(data.val().walks) + stats[6];
                update.sacs = +(data.val().sacs) + stats[7];
                update.strikeouts = +(data.val().strikeouts) + stats[8];
                update.outs = +(data.val().outs) + stats[9];
                // update field positions
                for (let i = 0; i < fieldPositions.length; i++) {
                    const position = (i+1).toString()
                    update[position] = +(data.val()[position] + fieldPositions[i]);
                }
            }
        });
        dbRef.off();
        dbRef.update(update)
        const percentages = {};
        dbRef.on(`value`, data => {
            if (data.val() !== null) {
                percentages.avg = (+(data.val().hits) / +(data.val().atbats)).toFixed(3);
                percentages.obp = ((+(data.val().hits) + +(data.val().walks)) / (+(data.val().atbats) + +(data.val().walks) + +(data.val().sacs))).toFixed(3);
                percentages.slg = ((+(data.val().singles) + (+(data.val().doubles) * 2) + (+(data.val().triples) * 3) + (+(data.val().homeruns) * 4)) / +(data.val().atbats)).toFixed(3);
            }
        });
        dbRef.off();
        dbRef.update(percentages)
        setResult("");
        setLocation("");
        setPrevRes("");
        setPrevLoc("");
    }, [batter, stats, fieldPositions])

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
                    SAC/FC
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
            <Modal.Body className="mx-auto">Update your player's outcome for this frame, or select "Correction" to re-score this frame.
            <div className="modalGrid">
                <div className="diamondModal">
                </div>
                <div className="resultsModal">
                    <Button variant="primary m-1" onClick={() => setResult("R")}>
                        RUN
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
            
            <Modal.Footer className="mx-auto">
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
            <Button variant="success" onClick={() => handleScoring(frame)}>
                Save Result
            </Button>
            </Modal.Footer>
        </Modal>   
        </>
    )
}
