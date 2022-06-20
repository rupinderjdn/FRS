# imports
import face_recognition as fr
import cv2
import numpy as np
import os
import json



# function to detect presence of face(s) in an image
# can take in URL of an image or image, with mode specified
# area of face not considered
def detect_face(img_obj, mode=0):
    if mode == 0:# passing image URL
        # load image
        input_image = fr.load_image_file(img_url)
    else:# passing image
        input_image = img_obj
        
    # detect faces
    input_face_locations = fr.face_locations(input_image, model='hog')
    
    # decision based on face detection in image
    if len(input_face_locations) == 0:
        detection_status = 'no_face'
    elif len(input_face_locations) == 1:
        detection_status = 'one_face'
    else:
        detection_status = 'multiple_faces'
    
    return detection_status, input_face_locations
    

    

# function to recognize a new face, outputs name if face already present in DB, else outputs 'unrecognised'
# area of face not considered
def recognize_face(img_url, fe_file, input_face_locations):
    
    # get json file of known face embeddings
    with open(fe_file, 'r') as f:
        face_emb = json.load(f)
    
    # convert face embeddings into numpy arrays
    for k in face_emb.keys():
        face_emb[k] = np.asarray(face_emb[k])
        
    # get all known faces and their respective encodings
    known_faces = list(face_emb.keys())
    known_face_encodings = list(face_emb.values())
    
    return known_faces
    
    # load image and get face encodings
    input_image = fr.load_image_file(img_url)
    input_face_encodings = fr.face_encodings(input_image, input_face_locations)
    
    # get face with min separation distance with given threshold - default threshold = 0.6
    name = []
    for (top, right, bottom, left), face_encoding in zip(input_face_locations, input_face_encodings):
        matches = fr.compare_faces(known_face_encodings, face_encoding)

        face_distances = fr.face_distance(known_face_encodings, face_encoding)
        best_match = np.argmin(face_distances)
        
        print(matches, face_distances, best_match)

        if matches[best_match]:
            #name = known_faces[best_match]
            name.append(known_faces[best_match])
        else:
            #name = 'unrecognised'
            name.append('unrecognised')
    
    return name, input_face_encodings

    
    

# function to save / replace face encodings
# area of face not considered
def save_face_encoding(face_name, fe_file, input_face_encodings):
    
    # get json file of known face embeddings
    with open(fe_file, 'r') as f:
        face_emb = json.load(f)
        
    # append new face encodings
    face_emb[face_name] = input_face_encodings.tolist()
    
    # save as json
    with open(fe_file, 'w') as f:
        json.dump(face_emb, f)
        
    return None
    
    
    
    
# wrapper function for adding a new face to the database
def add_new_replace_face_wrapper(img_url, face_name,  mode , fe_file,ignore=False):
    add_replace_status = {'face_detection':"", 'face_recognition': 'unrecognised', 'face_id': 'none'}
    
    # detect face
    detection_status, input_face_locations = detect_face(img_url, mode=0)
    add_replace_status['face_detection'] = detection_status
    
    # recognize face
    if detection_status == 'one_face':
        name, input_face_encodings = recognize_face(img_url, fe_file, input_face_locations)
        # if ignore flag is set
        if ignore:
            save_face_encoding(face_name, fe_file, input_face_encodings)
        
        else:
            if name == 'unrecognised':
                save_face_encoding(face_name, fe_file, input_face_encodings)
                
            # if face is unrecognized or ignore flag is set by user
            else:
                add_replace_status['face_recognition'] = 'recognised'
                add_replace_status['face_id'] = name
                
            
    print(add_replace_status)
    
    return
add_new_replace_face_wrapper(sys.argv[1], sys.argv[2])
