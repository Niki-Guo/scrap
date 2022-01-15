import React, { Component } from 'react';
import { Container } from 'reactstrap';
import { getTokenOrRefresh } from './token_util';
import './custom.css'
import { ResultReason, CancellationReason } from 'microsoft-cognitiveservices-speech-sdk';

const speechsdk = require('microsoft-cognitiveservices-speech-sdk')


export default class App extends Component {
    constructor(props) {
        super(props);

        this.state = {
            displayText: 'INITIALIZED: ready to test speech...'
        }
    }
    
    async componentDidMount() {
        // check for valid speech key/region
        const tokenRes = await getTokenOrRefresh();
        if (tokenRes.authToken === null) {
            this.setState({
                displayText: 'FATAL_ERROR: ' + tokenRes.error
            });
        }
    }

    async sttFromMic() {
        const tokenObj = await getTokenOrRefresh();
        const speechConfig = speechsdk.SpeechConfig.fromAuthorizationToken(tokenObj.authToken, tokenObj.region);
        speechConfig.speechRecognitionLanguage = 'en-US';
        
        const audioConfig = speechsdk.AudioConfig.fromDefaultMicrophoneInput();
        const recognizer = new speechsdk.SpeechRecognizer(speechConfig, audioConfig);

        this.setState({
            displayText: ''
        });

        // From Azure docs https://docs.microsoft.com/en-us/azure/cognitive-services/speech-service/get-started-speech-to-text?tabs=windowsinstall&pivots=programming-language-nodejs
        recognizer.recognizing = (s, e) => {
            console.log(`RECOGNIZING: Text=${e.result.text}`);
        };
        
        recognizer.recognized = (s, e) => {
            if (e.result.reason === ResultReason.RecognizedSpeech) {
                // console.log(`RECOGNIZED: Text=${e.result.text}`);
                this.setState(prevState => ({
                    displayText: [...prevState.displayText, e.result.text + ' ']
                }));
            }
            else if (e.result.reason === ResultReason.NoMatch) {
                console.log("NOMATCH: Speech could not be recognized.");
            }
        };
        
        recognizer.canceled = (s, e) => {
            console.log(`CANCELED: Reason=${e.reason}`);
        
            if (e.reason === CancellationReason.Error) {
                console.log(`"CANCELED: ErrorCode=${e.errorCode}`);
                console.log(`"CANCELED: ErrorDetails=${e.errorDetails}`);
                console.log("CANCELED: Did you update the key and location/region info?");
            }
        
            recognizer.stopContinuousRecognitionAsync();
        };
        
        recognizer.sessionStopped = (s, e) => {
            console.log("\n    Session stopped event.");
            recognizer.stopContinuousRecognitionAsync();
        };

        recognizer.startContinuousRecognitionAsync(result => {
            // let displayText;
            // if (result.reason === ResultReason.RecognizedSpeech) {
            //     displayText = `RECOGNIZED: Text=${result.text}`;
            // } else {
            //     displayText = 'ERROR: Speech was cancelled or could not be recognized. Ensure your microphone is working properly.';
            // }
            // // word processing
            // const displayTextArray = result.text.split(" ");
            // console.log(displayTextArray)
            // let word = "test";
            // if (displayTextArray.includes(word)) {
            //     displayText = "Test word detected"
            // } else {
            //     displayText = result.text
            // }

            // this.setState({
            //     displayText: displayText
            // });
        });

        // Doesn't work how to close from inside async
        setTimeout(() => recognizer.stopContinuousRecognitionAsync, 5000);

    }

    async fileChange(event) {
        const audioFile = event.target.files[0];
        console.log(audioFile);
        const fileInfo = audioFile.name + ` size=${audioFile.size} bytes `;

        this.setState({
            displayText: fileInfo
        });

        const tokenObj = await getTokenOrRefresh();
        const speechConfig = speechsdk.SpeechConfig.fromAuthorizationToken(tokenObj.authToken, tokenObj.region);
        speechConfig.speechRecognitionLanguage = 'en-US';

        const audioConfig = speechsdk.AudioConfig.fromWavFileInput(audioFile);
        const recognizer = new speechsdk.SpeechRecognizer(speechConfig, audioConfig);

        recognizer.recognizeOnceAsync(result => {
            let displayText;
            if (result.reason === ResultReason.RecognizedSpeech) {
                displayText = `RECOGNIZED: Text=${result.text}`
            } else {
                displayText = 'ERROR: Speech was cancelled or could not be recognized. Ensure your microphone is working properly.';
            }

            this.setState({
                displayText: fileInfo + displayText
            });
        });
    }

    render() {
        return (
            <Container className="app-container">
                <h1 className="display-4 mb-3">Speech sample app</h1>

                <div className="row main-container">
                    <div className="col-6">
                        <i className="fas fa-microphone fa-lg mr-2" onClick={() => this.sttFromMic()}></i>
                        Convert speech to text from your mic.

                        <div className="mt-2">
                            <label htmlFor="audio-file"><i className="fas fa-file-audio fa-lg mr-2"></i></label>
                            <input 
                                type="file" 
                                id="audio-file" 
                                onChange={(e) => this.fileChange(e)} 
                                style={{display: "none"}} 
                            />
                            Convert speech to text from an audio file.
                        </div>
                    </div>
                    <div className="col-6 output-display rounded">
                        <code>{this.state.displayText}</code>
                    </div>
                </div>
            </Container>
        );
    }
}