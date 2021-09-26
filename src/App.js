import logo from './logo.svg';
import './App.css';
import {useReducer, useRef, useState} from "react";
import _ from "lodash";

const initialState = {
    subjects: {"0": 'a'},
    objects: {'0': 'f1'},
    commands: {},
    validations: {}
}
const reducer = (state, action) => {
    switch (action.type) {
        case "addSubject":
            return {...state, subjects: {...state.subjects, [`${new Date().getTime()}`]: action.payload}}
        case "deleteSubject":
            let sId = action.payload
            delete state.subjects[action.payload]
            state.validations =  _.reduce(state.validations,(p,v,k)=>{
                if(v.subject!==sId){
                    p[k]=v
                }
                return p
            },{})

            state.commands =  _.reduce(state.commands,(p,v,k)=>{
                if(v.newOwner!==sId&&v.oldOwner!==sId){
                    p[k]=v
                }
                return p
            },{})

            return {...state,
                subjects: {...state.subjects},
            }
        case "addObject":
            return {...state, objects: {...state.objects, [`${new Date().getTime()}`]: action.payload}}
        case "deleteObject":
            let oId = action.payload
            delete state.objects[action.payload]
            state.validations =  _.reduce(state.validations,(p,v,k)=>{
                if(v.object!==oId){
                    p[k]=v
                }
                return p
            },{})

            state.commands =  _.reduce(state.commands,(p,v,k)=>{
                if(v.newFile!==oId&&v.oldFile!==oId){
                    p[k]=v
                }
                return p
            },{})
            return {...state, objects: {...state.objects}}
        case "addCommand":
            return {...state, commands: {...state.commands, [`${new Date().getTime()}`]: action.payload}}
        case "deleteCommand":
            delete state.commands[action.payload]
            return {...state, commands: {...state.commands}}
        case "addValidation":
            return {...state, validations: {...state.validations, [`${new Date().getTime()}`]: action.payload}}
        case "deleteValidation":
            delete state.validations[action.payload]
            return {...state, validations: {...state.validations}}
        default:
            return state
    }
}

function App() {
    const [{subjects, objects, commands, validations}, dispatch] = useReducer(reducer, initialState, () => initialState)
    const [sName, setSName] = useState('')
    const [oName, setOName] = useState('')
    const [command, setCommand] = useState("mo")
    const [output, setOutput] = useState(null)
    const newOwner = useRef(null), newFile = useRef(null), oldOwner = useRef(null), oldFile = useRef(null),
        newOwnerOldFile = useRef(null), validationOwner = useRef(null), validationFile = useRef(null);

    const addCommand = () => {
        let payload = {}
        payload["command"] = command
        if (command === "mo") {
            payload["newOwner"] = newOwner.current.value
            payload["newFile"] = newFile.current.value
        } else if (command === "grr") {
            payload["oldOwner"] = oldOwner.current.value
            payload["oldFile"] = oldFile.current.value
            payload["newOwner"] = newOwnerOldFile.current.value
        }
        dispatch({
            type: "addCommand",
            payload
        })
    }
    const addValidation = () => {
        let payload = {
            "subject": validationOwner.current.value,
            "object": validationFile.current.value
        }
        dispatch({
            type: "addValidation",
            payload
        })
    }
    const codeToString = (key, permissionObject) => {
        switch (permissionObject[key]) {
            case 1:
                return "r"
            case 2:
                return "o"
            case 3:
                return "ro"
            default:
                return null
        }
    }
    const generatePermissionObject = () => {
        let permissionObject = {};
        _.each(subjects, (ov, oId) => {
            _.each(subjects, (iv, iId) => {
                permissionObject[`${oId}${iId}`] = 0
            })
            _.each(objects, (iv, iId) => {
                permissionObject[`${oId}${iId}`] = 0
            })
        })
        _.each(commands, (c, id) => {
            let key = c.newOwner + c.newFile
            if (c.command === "mo") {
                if ([0, 2].includes(permissionObject[key])) {
                    permissionObject[key] = 2
                } else if ([1, 3].includes(permissionObject[key])) {
                    permissionObject[key] = 3
                }
            } else if (c.command === "grr") {
                let ownerKey = c.oldOwner + c.oldFile
                if ([2, 3].includes(permissionObject[ownerKey])) {
                    if ([0, 1].includes(permissionObject[key])) {
                        permissionObject[key] = 1
                    } else if ([2, 3].includes(permissionObject[key])) {
                        permissionObject[key] = 3
                    }
                }
            }
        })
        let tempO = []
        let table = <table>
            <thead>
            <tr>
                <td/>
                {_.map(subjects, (v, id) => <td>{v}</td>)}
                {_.map(objects, (v, id) => <td>{v}</td>)}
            </tr>
            <tbody>
            {_.map(subjects, (ov, oId) => <tr>
                <td>{ov}</td>
                {_.map(subjects, (v, id) => <td>{
                    codeToString(oId + id, permissionObject)
                }</td>)}
                {_.map(objects, (v, id) => <td>{
                    codeToString(oId + id, permissionObject)
                }</td>)}
            </tr>)}
            </tbody>
            </thead>
        </table>
        tempO.push(table)
        _.each(validations, (v, id) => {
            let key = v.subject + v.object
            tempO.push(<p>{subjects[v.subject]} has read access
                to {objects[v.object]}, {[1, 2, 3].includes(permissionObject[key]) ? "True" : "False"}</p>)
        })
        setOutput(tempO)
    }


    return (
        <div className="App">
            <div style={{
                display: "flex"
            }}>
                <div style={{
                    border:'black solid 1px'
                }}>
                    <h1>Subjects</h1>
                    <div style={{
                        display: 'flex'
                    }}>
                        {_.map(subjects, (v, id) => <div style={{
                            display: 'flex'
                        }}><p>{v}</p>
                            <button onClick={() => dispatch({type: "deleteSubject", payload: id})}>Delete</button>
                        </div>)}
                    </div>
                    <input type="text" value={sName} onChange={e => setSName(e.target.value)}/>
                    <button onClick={() => {
                        if (sName) {
                            dispatch({type: "addSubject", payload: sName})
                            setSName("")
                        }
                    }}>Add
                    </button>
                </div>
                <div style={{
                    border:'black solid 1px'
                }}>
                    <h1>Objects</h1>
                    <div style={{
                        display:'flex'
                    }}>
                        {_.map(objects, (v, id) => <div style={{
                            display:'flex'
                        }}><p>{v}</p>
                            <button onClick={() => dispatch({type: "deleteObject", payload: id})}>Delete</button>
                        </div>)}
                    </div>
                    <input type="text" value={oName} onChange={e => setOName(e.target.value)}/>
                    <button onClick={() => {
                        if (oName) {
                            dispatch({type: "addObject", payload: oName})
                            setOName("")
                        }
                    }}>Add
                    </button>
                </div>
            </div>
            <div style={{
                display: "flex"
            }}>
                <div style={{
                    border:'black solid 1px'
                }} >
                    <h1>Commands</h1>
                    <div >{_.map(commands, (v, id) => <div style={{
                        display:"flex"
                    }}>
                        {v.command === "mo" && <p>Make {subjects[v.newOwner]} owner of {objects[v.newFile]}</p>}
                        {v.command === "grr" &&
                        <p>Grant {subjects[v.oldOwner]}'s read right
                            of {objects[v.oldFile]} to {subjects[v.newOwner]}</p>}
                        <button onClick={() => dispatch({type: "deleteCommand", payload: id})}>Delete</button>
                    </div>)}
                    </div>
                    <div >
                        <select name="command" id="command" value={command} onChange={e => setCommand(e.target.value)}>
                            <option value="mo">Make Owner</option>
                            <option value="grr">Grant Read Rights</option>
                        </select>
                        {command === "mo" && <div style={{
                            display:"flex"
                        }}>
                            <p>Make</p>
                            <select name="newOwner" id="newOwner" ref={newOwner}>
                                {_.map(subjects, (v, id) => <option value={id}>{v}</option>)}
                            </select>
                            <p>owner of </p>
                            <select name="newFIle" id="newFile" ref={newFile}>
                                {_.map(objects, (v, id) => <option value={id}>{v}</option>)}
                            </select>
                        </div>}
                        {command === "grr" && <div style={{
                            display:"flex"
                        }}>
                            <select name="oldOwner" id="oldOwner" ref={oldOwner}>
                                {_.map(subjects, (v, id) => <option value={id}>{v}</option>)}
                            </select>
                            <p>grants read rights of </p>
                            <select name="oldFIle" id="olfFile" ref={oldFile}>
                                {_.map(objects, (v, id) => <option value={id}>{v}</option>)}
                            </select>
                            <p> to </p>
                            <select name="newOwner" id="newOwner" ref={newOwnerOldFile}>
                                {_.map(subjects, (v, id) => <option value={id}>{v}</option>)}
                            </select>
                        </div>}
                        <button onClick={addCommand}> Add Command</button>
                    </div>
                </div>
                <div style={{
                    border:'black solid 1px'
                }} >
                    <h1>Validations</h1>
                    <div>{_.map(validations, (v, id) => <div style={{
                        display:"flex"
                    }}>
                        <p>Does {subjects[v.subject]} have read rights of {objects[v.object]}</p>
                        <button onClick={() => dispatch({type: "deleteValidation", payload: id})}>Delete</button>
                    </div>)}
                    </div>
                    <div>
                        <div style={{
                            display:"flex"
                        }}>
                            <p>Does </p>
                            <select name="validationOwner" id="validationOwner" ref={validationOwner}>
                                {_.map(subjects, (v, id) => <option value={id}>{v}</option>)}
                            </select>
                            <p> can read </p>
                            <select name="validationFile" id="validationFile" ref={validationFile}>
                                {_.map(objects, (v, id) => <option value={id}>{v}</option>)}
                            </select>
                        </div>
                        <button onClick={addValidation}> Add Validation</button>
                    </div>
                </div>
            </div>
            <button onClick={generatePermissionObject}> Start</button>
            <div>
                {output}
            </div>
        </div>
    );
}

export default App;
