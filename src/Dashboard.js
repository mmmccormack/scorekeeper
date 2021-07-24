import React, { useRef, useState, useEffect } from 'react';
import { Card, Form, Button, Alert, Modal } from 'react-bootstrap';
import { useAuth } from  './AuthContext';
import { Link, useHistory, useLocation } from 'react-router-dom';
import firebase from './firebase';

export default function Dashboard() {
    const nameRef = useRef();
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const { currentUser, logout } = useAuth();
    const history = useHistory();
    const location = useLocation();
    const [playerList, setPlayerList] = useState([]);
    const loadValue = location.state === undefined ? ["playerName",0,0,0,0,0,0,0,0,0] : location.state.detail;
    const loadScore = location.state === undefined ? 0 : location.state.score;
    // setting state for showing the modal for starting a new scoresheet
    const [show, setShow] = useState(false);
    const closeModal = () => setShow(false);
    const showModal = () => setShow(true);

    const changeScreen = (path, arrayToBePassed, score) => {
        history.push({
            pathname: `/${path}`,
            state: { 
                detail: arrayToBePassed,
                score: loadScore
             }
        });
    }

    async function handleLogout() {
        setError('');

        try {
            await logout();
            history.push("/");
        } catch {
            setError('Failed to log out.')
        }
    }

    // makes input box submission into title case
    function titleCase(inputString) {
        return inputString.toLowerCase().split(' ').map(function(letter) {
          return (letter.charAt(0).toUpperCase() + letter.slice(1));
        }).join(' ');
      }

    // adds a player name to the dB
    function addPlayer() {
        const playerName = titleCase(nameRef.current.value);
        const uid = firebase.auth().currentUser.uid;
        if (playerList.includes(playerName)) {
            setError('Name already exists in roster!');
            setMessage('');
        } else {
            firebase.database().ref(`users/${uid}/${playerName}`).update(
                {
                    hits: 0,
                    atbats: 0,
                    walks: 0,
                    strikeouts: 0,
                    singles: 0,
                    doubles: 0,
                    triples: 0,
                    homeruns: 0,
                    sacs: 0,
                    outs: 0,
                    runs: 0,
                    avg: 0,
                    obp: 0,
                    slg: 0,
                    ops: 0,
                    "1": 0,
                    "2": 0,
                    "3": 0,
                    "4": 0,
                    "5": 0,
                    "6": 0,
                    "7": 0,
                    "8": 0,
                    "9": 0,
                }
            );
            setMessage('Player added to roster!');
            setError('');
        }
    }

    // removes a player from the team roster
    const removePlayer = () => {
        const playerName = titleCase(nameRef.current.value)
        const uid = firebase.auth().currentUser.uid;
        if (playerList.includes(playerName)) {
            firebase.database().ref(`users/${uid}/${playerName}`).remove();
            setMessage('Player removed from roster!');
            setError('');
        } else {
            setError(`Name doesn't exist in roster!`);
            setMessage('');
        }
    }

    // useEffect adds player roster to state for checks to add or remove players
    useEffect(() => {
        const uid = firebase.auth().currentUser.uid;
        const dbRef = firebase.database().ref(`users/${uid}`);
        const playerListPull = []
        dbRef.on(`value`, response => {
            for (let player in response.val()) {
                playerListPull.push(player)
            }
        });
        setPlayerList(playerListPull);
        return () => {
            dbRef.off();
        }
    }, [])

    return (
        <>
            <Modal show={show} onHide={closeModal}>
            <Modal.Header>
                <Modal.Title>Score Game</Modal.Title>
            </Modal.Header>
            <Modal.Body className="mx-auto">
                <p>Do you want to start scoring a new game or continue scoring the existing one?</p>
            </Modal.Body>
            <Modal.Footer className="mx-auto">
                <Button variant="danger" onClick={() => changeScreen('scorekeeper', ["playerName",0,0,0,0,0,0,0,0,0], 0)}>
                Start New Game
                </Button> 
            <Button variant="info" onClick={() => changeScreen('scorekeeper', loadValue, loadScore)}>
                Continue Game
            </Button>
            </Modal.Footer>
        </Modal>
            <Card>
                <Card.Body>
                    <h2 className="text-center mb-4">Team Dashboard</h2>
                    <strong>Email:</strong> {currentUser.email}
                    <Link to="/update-profile" className="btn btn-info w-100 mt-3">Update Info</Link>
                    <Form>
                        <Form.Group id="name">
                            <Form.Label>Player Name</Form.Label>
                            <Form.Control type="name" ref={nameRef} required />
                        </Form.Group>
                        <Button className="btn btn-success w-50" onClick={() => { addPlayer(nameRef) }}>Add Player</Button>
                        <Button className="btn btn-danger w-50" onClick={() => { removePlayer(nameRef) }}>Remove Player</Button>
                        {error && <Alert variant="danger">{error}</Alert>}
                        {message && <Alert variant="success">{message}</Alert>}
                        <button onClick={() => changeScreen('team-stats', loadValue, loadScore)} className="btn btn-info w-100 mt-3">Team Stats</button>
                    </Form>
                    <Button className="btn btn-warning w-100 mt-3" onClick={() => { showModal()}}>Score Game</Button>

                </Card.Body>

            </Card>
            <div className="w-100 text-center mt-2">
                <Button variant="link" onClick={handleLogout}>Log Out</Button>
            </div> 
        </>
    )
}
