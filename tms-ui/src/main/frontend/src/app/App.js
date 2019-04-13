import "./component/project/index.css";
import "github-fork-ribbon-css/gh-fork-ribbon.css";
import 'bootstrap/dist/css/bootstrap.min.css';

import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';

import 'bootstrap/dist/js/bootstrap.bundle.min';
import ProjectsTasks from "./component/project/ProjectsTasks";
import ProjectInfo from "./component/project/ProjectInfo";
import AddTask from "./component/project/AddTask";
import ProjectsSettings from "./component/project/ProjectsSettings";
import CreateProject from "./component/project/CreateProject";
import PersonalArea from "./component/project/PersonalArea";
import CreatedProjects from "./component/project/CreatedProjects";
import HelloWorld from "./component/HelloWorld";
import AboutUser from "./component/user/AboutUser";

import React, { Component } from 'react'
import { Container } from 'react-bootstrap'

import NavigationBar from './component/navigation/NavigationBar.js';
import { AuthConsumer } from "./component/login/AuthContext";
import SignTabs from "./component/login/SignTabs";

class App extends Component {
    constructor(props) {
        super(props);
    }

    guest() {
        return <SignTabs/>
    }

    loggedIn() {
        return <Router>
            <Switch>
                <Route path="/hello" component={HelloWorld} />

                <Route path="/user/:id" component={AboutUser} />
                <Route path="/createproject" component={CreateProject} />
                <Route path="/projectstasks/:id" component={ProjectsTasks} />
                <Route path="/projectssettings/:id" component={ProjectsSettings} />
                <Route path="/projectinfo/:id" component={ProjectInfo} />
                <Route path="/addTask" component={AddTask} />
                <Route path="/personalarea" component={PersonalArea} />
                <Route path="/createdprojects/:id" component={CreatedProjects} />
            </Switch>
        </Router>;
    }

    render() {
        return <Container>
            <NavigationBar/>
            <AuthConsumer>
                {({ isAuth }) => isAuth ? this.loggedIn() : this.guest()}
            </AuthConsumer>
        </Container>;
    }
}

export default App;