import React, {Component} from 'react';
import AwesomeListMenu from '../../components/AwesomeLists/AwesomeListMenu';
import AwesomeRwdMenu from '../../components/AwesomeRwdMenu/AwesomeRwdMenu';
import AwesomeLists from '../../components/AwesomeLists/AwesomeLists';
import AwesomeInput from '../../components/AwesomeInput/AwesomeInput';
import AwesomeReadme from '../AwesomeReadme/AwesomeReadme';
import Spinner from '../../components/UI/Spinner/Spinner';
import axios from 'axios';
import Fuse from 'fuse.js';
import {Route, withRouter} from 'react-router-dom';
import Backdrop from '../../components/UI/Backdrop/Backdrop';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faBars, faCog, faFolder, faList, faDownload, faUpload} from '@fortawesome/free-solid-svg-icons';
import classes from './AwesomeSearch.module.css';
import {MdDarkMode, MdLightMode} from 'react-icons/md';

// New feature imports
import { CollectionManager } from '../../components/Collections';
import { ListManager } from '../../components/ListManager';
import { AIRecommendations } from '../../components/AI';
import { SettingsPanel } from '../../components/Settings';
import { ExportModal, ImportModal } from '../../components/ImportExport';
import CollectionsContext from '../../context/CollectionsContext';

class AwesomeSearch extends Component {
    static contextType = CollectionsContext;
    
    state = {
        errorMessage: null,
        subjects: null,
        selectedSubject: '',
        subjectsArray: [],
        search: '',
        searchResult: [],
        showResult: false,
        showMenu: false,
        // New feature state
        activeView: 'search', // 'search' | 'collections' | 'lists'
        showSettings: false,
        showExport: false,
        showImport: false,
    };

    getSubjectEntries = () => {
        axios
            .get(
                'https://raw.githubusercontent.com/lockys/awesome.json/master/awesome/awesome.json'
            )
            .then((subjects) => {
                this.setState({
                    subjects: subjects.data,
                    errorMessage: '',
                });

                let subjectsArray = Object.keys(subjects.data)
                    .map((subject) => {
                        return subjects.data[subject];
                    })
                    .reduce((arr, el) => {
                        return arr.concat(el);
                    }, []);

                this.setState({subjectsArray: subjectsArray});

                if (!this.state.subjects) {
                    this.setState({
                        errorMessage:
                            'There was an error. Unable to load the Awesome subjects.',
                    });
                }
            })
            .catch((error) => {
                this.setState({
                    errorMessage: `There was an error. Unable to load the Awesome subjects: ${error}.`,
                });
            });
    };

    componentDidMount() {
        this.getSubjectEntries();
    }

    topicOnClickHandler = (topic) => {
        this.setState({selectedSubject: topic, showMenu: false});
    };

    searchInputOnChangeHandler = (event) => {
        this.setState({
            search: event.target.value,
        });

        const options = {
            keys: ['name'],
        };

        const fuse = new Fuse(this.state.subjectsArray, options);
        const result = fuse.search(event.target.value);

        this.setState({searchResult: result.slice(0, 20)});
    };

    searchInputOnFocusHandler = () => {
        this.setState({showResult: true});
    };

    searchInputOnCloseHandler = () => {
        this.setState({showResult: false});
    };

    setMdHandler = (md) => {
        this.setState({
            md: md,
        });
    };

    burgerButtonClickHandler = () => {
        this.setState((prevState) => {
            return {
                showMenu: !prevState.showMenu,
                showResult: false,
            };
        });
    };

    // New feature handlers
    setActiveView = (view) => {
        this.setState({ activeView: view, showMenu: false });
    };

    toggleSettings = () => {
        this.setState(prev => ({ showSettings: !prev.showSettings }));
    };

    toggleExport = () => {
        this.setState(prev => ({ showExport: !prev.showExport }));
    };

    toggleImport = () => {
        this.setState(prev => ({ showImport: !prev.showImport }));
    };

    handleAddToCollection = (item) => {
        // This will be called from AIRecommendations to add items to a collection
        console.log('Add to collection:', item);
        // The actual logic is handled by the CollectionsContext
    };

    render() {
        const { activeView, showSettings, showExport, showImport } = this.state;
        
        return (
            <div className={`${classes.AwesomeSearch} ${classes[this.props.theme]}`}>
                <div className="grid">
                    <div className="cell -12of12">
                        <AwesomeInput
                            searchOnchange={this.searchInputOnChangeHandler}
                            value={this.state.search}
                            searchResult={this.state.searchResult}
                            searchInputOnFocus={this.searchInputOnFocusHandler}
                            showResult={this.state.showResult}
                            homeOnClick={this.topicOnClickHandler}
                        />

                        <div
                            className={classes.BurgerButton}
                            onClick={this.burgerButtonClickHandler}
                        >
                            <FontAwesomeIcon icon={faBars}/>
                        </div>

                        {/* New Feature Navigation */}
                        <div className={classes.FeatureNav}>
                            <button
                                className={`${classes.NavButton} ${activeView === 'collections' ? classes.Active : ''}`}
                                onClick={() => this.setActiveView('collections')}
                                title="Collections"
                            >
                                <FontAwesomeIcon icon={faFolder} />
                            </button>
                            <button
                                className={`${classes.NavButton} ${activeView === 'lists' ? classes.Active : ''}`}
                                onClick={() => this.setActiveView('lists')}
                                title="List Manager"
                            >
                                <FontAwesomeIcon icon={faList} />
                            </button>
                            <button
                                className={classes.NavButton}
                                onClick={this.toggleExport}
                                title="Export"
                            >
                                <FontAwesomeIcon icon={faDownload} />
                            </button>
                            <button
                                className={classes.NavButton}
                                onClick={this.toggleImport}
                                title="Import"
                            >
                                <FontAwesomeIcon icon={faUpload} />
                            </button>
                            <button
                                className={classes.NavButton}
                                onClick={this.toggleSettings}
                                title="Settings"
                            >
                                <FontAwesomeIcon icon={faCog} />
                            </button>
                        </div>

                        <div
                            className="btn-group"
                            style={{float: 'right', fontSize: '2rem', cursor: 'pointer', verticalAlign: 'middle'}}
                        >
                            {!this.props.isDark ? <MdDarkMode
                                onClick={() => {
                                    localStorage.setItem('__isDark', 'true');
                                    this.props.onThemeChange(true);
                                }}
                            /> : <MdLightMode
                                onClick={() => {
                                    localStorage.setItem('__isDark', 'false');
                                    this.props.onThemeChange(false);
                                }}
                            />}
                        </div>
                    </div>
                </div>

                {this.state.subjects ? (
                    <div className="grid">
                        {/* Only show sidebar in search view */}
                        {activeView === 'search' && (
                            <div
                                className="cell -2of12"
                                style={{
                                    width: '100%',
                                }}
                            >
                                {this.state.showMenu ? (
                                    <AwesomeRwdMenu
                                        topics={Object.keys(this.state.subjects)}
                                        topicOnClickHandler={this.topicOnClickHandler}
                                    />
                                ) : null}
                                <AwesomeListMenu
                                    topics={Object.keys(this.state.subjects)}
                                    topicOnClickHandler={this.topicOnClickHandler}
                                />
                            </div>
                        )}
                        
                        <div
                            className={activeView === 'search' ? 'cell -10of12' : 'cell -12of12'}
                            style={{
                                width: '100%',
                            }}
                        >
                            {/* Original Search View */}
                            {activeView === 'search' && (
                                <>
                                    {/* AI Recommendations */}
                                    {this.state.search && (
                                        <AIRecommendations
                                            query={this.state.search}
                                            subjectsArray={this.state.subjectsArray}
                                            onAddToCollection={this.handleAddToCollection}
                                        />
                                    )}
                                    
                                    <Route
                                        path="/"
                                        exact
                                        render={() => {
                                            return (
                                                <AwesomeLists
                                                    topic={this.state.selectedSubject}
                                                    subjects={this.state.subjects[this.state.selectedSubject]}
                                                />
                                            );
                                        }}
                                    />
                                    <Route
                                        path="/:user/:repo"
                                        render={(props) => {
                                            return (
                                                <AwesomeReadme
                                                    key={props.match.params.repo}
                                                    setMdHandler={this.setMdHandler}
                                                    {...props}
                                                />
                                            );
                                        }}
                                    />
                                </>
                            )}

                            {/* Collections View */}
                            {activeView === 'collections' && (
                                <div className={classes.FeatureView}>
                                    <button 
                                        className={classes.BackButton}
                                        onClick={() => this.setActiveView('search')}
                                    >
                                        ← Back to Search
                                    </button>
                                    <CollectionManager />
                                </div>
                            )}

                            {/* List Manager View */}
                            {activeView === 'lists' && (
                                <div className={classes.FeatureView}>
                                    <button 
                                        className={classes.BackButton}
                                        onClick={() => this.setActiveView('search')}
                                    >
                                        ← Back to Search
                                    </button>
                                    <ListManager 
                                        allLists={this.state.subjectsArray}
                                        onRefresh={this.getSubjectEntries}
                                    />
                                </div>
                            )}
                        </div>

                        <Backdrop
                            show={this.state.showResult}
                            closeSearchModal={this.searchInputOnCloseHandler}
                        />
                    </div>
                ) : (
                    <Spinner/>
                )}

                {/* Modals */}
                <SettingsPanel
                    isOpen={showSettings}
                    onClose={this.toggleSettings}
                    onExport={this.toggleExport}
                    onImport={this.toggleImport}
                />

                <ExportModal
                    isOpen={showExport}
                    onClose={this.toggleExport}
                />

                <ImportModal
                    isOpen={showImport}
                    onClose={this.toggleImport}
                />
            </div>
        );
    }
}

export default withRouter(AwesomeSearch);
