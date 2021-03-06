import React, { Component } from 'react';
import { Modal, Container, Button, Card, CardDeck } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { AuthConsumer } from '../login/AuthContext';
import axios from 'axios';
import { backurl } from '../../properties';
import { authorizationHeader, shortenIfLong } from '../../actions';

export default class ProjectBoard extends Component {
    constructor(props) {
        super(props);

        this.state = {
            deleteProject: -1,
            show: false
        }

        this.onDelete = this.onDelete.bind(this);
        this.deleteProject = this.deleteProject.bind(this);

        this.handleCancel = this.handleCancel.bind(this);
        this.handleShow = this.handleShow.bind(this);
        this.handleClose = this.handleClose.bind(this);
    }

    handleCancel(event) {
        event.preventDefault();
    }

    handleClose() {
        this.setState({ show: false });
    }

    handleShow(event) {
        event.preventDefault();

        this.setState({ show: true });
    }

    makeControlLinks(project) {
        let edit = 'projects/edit/' + project.id;

        return <div className='float-right'>
            <Button size='sm' variant='success' value={project.id}><Link className='link' to={edit}>&nbsp; Edit &nbsp;</Link></Button>
            &nbsp;
            <Button size='sm' variant='danger' value={project.id} onClick={this.onDelete}>Delete</Button>
        </div>
    }

    controlIfCreator(project) {
        return <AuthConsumer>
            {({ user }) => user.id === project.creator.id ? this.makeControlLinks(project) : <br />}
        </AuthConsumer>
    }

    onDelete(event) {
        const projectId = parseInt(event.target.value);

        const project = this.props.projects.find((p) => p.id === projectId);

        this.setState({ deleteProject: project });
        this.handleShow(event);
    }

    deleteProject(event) {
        event.preventDefault();

        const project = this.state.deleteProject;
        axios.delete(backurl + '/projects/' + project.id, authorizationHeader())
            .then(response => {
                alert(project.name + ' deleted');
                window.location.reload(false);
            })
            .catch(error => {
                alert(error.response.status);
            })

        this.handleClose();
    }

    onClickCreateProject(event) {
        event.preventDefault();
        this.props.history.push('/projects/new');

    }

    processProjectCard(project) {
        if (project === stub)
            return <Card>
                <Card.Header>
                        <h4>Create new</h4>
                </Card.Header>
                <Card.Body className='d-flex' align='center'>
                    <Button className='p-5 w-100 rounded' variant='outline-dark'>
                        <Link className='black-link' to='/projects/new'><h1 className='display-3'>+</h1></Link>
                    </Button>
                </Card.Body>
            </Card>

        return <Card>
            <Card.Header>
                <Link to={'/projects/' + project.id}>
                    <h4>{shortenIfLong(project.name, 29)}</h4>
                </Link>
            </Card.Header>
            <Card.Body>
                <Card.Subtitle className='mb-2 text-muted'>
                    <Link to={'/users/' + project.creator.id}>{project.creator.name}</Link>
                </Card.Subtitle>
                <br />
                <Card.Text>
                    {parseMdToText(project.description)}
                </Card.Text>
        {this.controlIfCreator(project)}
            </Card.Body>
        </Card>
    }

    render() {
        const colNum = 3;
        const rawProjects = this.props.projects;

        while (rawProjects.length % colNum)
            rawProjects.push(stub);

        var matrix = reshape(rawProjects, colNum);

        return <div>
            <Modal show={this.state.show} onHide={this.handleClose}>
                <Modal.Header closeButton>
                    <Modal.Title>Delete project</Modal.Title>
                </Modal.Header>
                <Modal.Body style={{ wordBreak: 'break-all' }}>Are you sure you want to delete project '{this.state.deleteProject.name}'?</Modal.Body>
                <Modal.Footer>
                    <Button variant='secondary' onClick={this.handleClose}>
                        Cancel
                        </Button>
                    <Button variant='danger' onClick={this.deleteProject}>
                        Delete
                        </Button>
                </Modal.Footer>
            </Modal>
            <Container>
                {matrix.map((row) => <div><CardDeck>
                    {row.map(
                        (project) => this.processProjectCard(project)
                    )}
                </CardDeck>
                    <br />
                </div>
                )}
            </Container>
        </div>
    }
}

const removeMd = require('remove-markdown');
const DESCRIPTION_LENGTH = 140;
function parseMdToText(markdown) {
    let text = removeMd(markdown, {
        stripListLeaders: true, // strip list leaders (default: true)
        listUnicodeChar: '',     // char to insert instead of stripped list leaders (default: '')
        gfm: true,                // support GitHub-Flavored Markdown (default: true)
        useImgAltText: true      // replace images with alt-text, if present (default: true)
    });

    return text.length > DESCRIPTION_LENGTH ? text.substring(0, DESCRIPTION_LENGTH - 3) + '...' : text;
}

function reshape(list, elementsPerSubArray) {
    var matrix = [], i, k;
    for (i = 0, k = -1; i < list.length; i++) {
        if (i % elementsPerSubArray === 0) {
            k++;
            matrix[k] = [];
        }
        matrix[k].push(list[i]);
    }
    return matrix;
}

let stub = { name: '', description: '', owner: { name: null } }