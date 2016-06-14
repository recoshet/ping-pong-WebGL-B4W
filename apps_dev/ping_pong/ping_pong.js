"use strict"

// register the application module
b4w.register("ping_pong", function(exports, require) {

// import modules used by the app
var m_app  = require("app");
var m_cfg  = require("config");
var m_data = require("data");
var m_ver  = require("version");

var m_ping_pong = require('ping_pong_game');


// detect application mode
var DEBUG = (m_ver.type() === "DEBUG");

// automatically detect assets path
var APP_ASSETS_PATH = m_cfg.get_std_assets_path() + "ping_pong/";

/**
 * export the method to initialize the app (called at the bottom of this file)
 */
exports.init = function() {
    m_app.init({
        canvas_container_id: "main_canvas_container",
        callback: init_cb,
        show_fps: DEBUG,
        console_verbose: DEBUG,
        autoresize: true
    });
}

/**
 * callback executed when the app is initialized 
 */
function init_cb(canvas_elem, success) {

    if (!success) {
        console.log("b4w init failure");
        return;
    }

    load();
}

/**
 * load the scene data
 */
function load() {
    m_data.load(APP_ASSETS_PATH + "ping_pong.json", load_cb);
}

/**
 * callback executed when the scene is loaded
 */
function load_cb(data_id, success) {

    if (!success) {
        console.log("b4w load failure");
        return;
    }

    m_app.enable_camera_controls();

    // place your code here
    m_ping_pong.init();
    m_ping_pong.game.startGame();
    //m_ping_pong.startGame();
}


});

// import the app module and start the app by calling the init method
b4w.require("ping_pong").init();
