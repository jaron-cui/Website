import React, { useState } from 'react';
import logo from './logo.svg';
import './App.css';
import { Route, Routes, useLocation } from 'react-router-dom';
import Home from './page/Home';
import 'bootstrap/dist/css/bootstrap.min.css';
import Navigation from './page/component/Navigation';
import Projects from './page/Projects';
import ProjectPage from './page/Project';
import Experience from './page/Experience';
import NotFound from './page/NotFound';

function App() {
  const { pathname, hash } = useLocation();
  const currentPath = pathname + hash;

  function getPage() {
    switch (currentPath) {
      case '/':
        return <Home />;
      case '/#/projects':
        return <Projects />;
      case '/#/experience':
        return <Experience />;
      default:
        const prefix = '/#/projects/'
        return (currentPath.slice(0, prefix.length) === prefix) ?
          <ProjectPage project={currentPath.slice(prefix.length)}/> :
          <NotFound message='Sorry, could not find that page!'/>
    }
  }

  return (
    <>
      <Navigation currentPath={currentPath}/>
      <div className='margin'>
        {getPage()}
      </div>
    </>
  );
}

export default App;
