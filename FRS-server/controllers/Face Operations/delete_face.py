# imports
import os
import json



# wrapper function for deleting a face from the database
def delete_face_wrapper(fe_file, face_name):
    
    # get json file of known face embeddings
    with open(fe_file, 'r') as f:
        face_emb = json.load(f)
        
    # delete face from the face encodings DB
    ret_val = face_emb.pop(face_name, 'face_does_not_exist')
    if ret_val != 'face_does_not_exist':
        ret_val = 'success'
    
        # save as json
        with open(fe_file, 'w') as f:
            json.dump(face_emb, f)
    
    print(ret_val)
    
    return
    
    
