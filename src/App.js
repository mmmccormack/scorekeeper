import React from "react";
import './App.css';
import { Container } from "react-bootstrap";
import { AuthProvider } from "./AuthContext";
import {BrowserRouter as Router, Switch, Route } from 'react-router-dom';
import Signup from "./Signup";
import Dashboard from './Dashboard';
import Login from './Login';
import PrivateRoute from "./PrivateRoute";
import ForgotPassword from "./ForgotPassword";
import TeamStats from "./TeamStats";
import Scorekeeper from "./Scorekeeper";
import UpdateProfile from "./UpdateProfile";

function App() {
  return (
    
      <Container className="d-flex align-items-center justify-content-center"
      style={{minHeight: "100vh"}}>
        <div className="w-100" style={{maxWidth: '768px'}}>
          <Router>
            <AuthProvider>
              <Switch>
                <PrivateRoute exact path="/" component={Dashboard} />
                <PrivateRoute path="/update-profile" component={UpdateProfile} />
                <PrivateRoute path="/team-stats" component={TeamStats} />
                <PrivateRoute path="/scorekeeper" component={Scorekeeper} />
                <Route path="/signup" component={Signup} />
                <Route path="/login" component={Login} />
                <Route path="/forgot-password" component={ForgotPassword} />
              </Switch>
            </AuthProvider>
          </Router>
        </div>
      </Container>
  )
}

export default App;
