import React, { useState } from 'react';
import logo from './logo.svg';
import './App.css';
import { Route, Routes } from 'react-router-dom';
import Home from './Home';
import 'bootstrap/dist/css/bootstrap.min.css';
import Navigation from './Navigation';
import Projects from './Projects';
import ProjectPage from './ProjectPage';
import Experience from './Experience';
import NotFound from './NotFound';

function App() {
  return (
    <>
      <Navigation/>
      <div className='margin'>
        <Routes>
          <Route path="/" element={<Home />}/>
          <Route path="/projects" element={<Projects />}/>
          <Route path="/projects/:project" element={<ProjectPage />}/>
          <Route path="/experience" element={<Experience />}/>
          <Route path='*' element={<NotFound message='Sorry, could not find that page!'/>} />
        </Routes>
      </div>
    </>
  );
}

export default App;
