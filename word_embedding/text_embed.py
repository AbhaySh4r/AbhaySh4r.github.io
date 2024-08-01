import re

import yaml
import json
import numpy as np
from openai import OpenAI

def extract_text_from_yaml(yaml_content):
    def extract_text(data, key_to_skip="publications"):
        if isinstance(data, dict):
            text = ""
            for key, value in data.items():
                if key != key_to_skip:
                    text += " " + extract_text(value, key_to_skip)
            return text
        elif isinstance(data, list):
            return " ".join(extract_text(item, key_to_skip) for item in data)
        else:
            return str(data)
    
    return extract_text(yaml_content)

def scrape_and_embed_words(yaml_file_path):
    try:
        # Open and read the YAML file
        with open(yaml_file_path, 'r', encoding='utf-8') as file:
            yaml_content = yaml.safe_load(file)

        # Extract text content excluding the "publications" section
        text_content = extract_text_from_yaml(yaml_content)

        # Use regular expressions to find words (ignoring case)
        words = re.findall(r'\b\w+\b', text_content.lower())

        # Create a set to store unique words
        unique_words = set(words)
        
        # Remove words containing numbers
        unique_words = {word for word in unique_words if not re.search(r'\d', word)}
        print(f'Unique words in your Portofolio: {unique_words}')

        # Placeholder for word embeddings (replace this with your actual encoding logic)
        # Assuming you have a function get_word_embedding(word) that returns the embedding for a word
        word_embeddings = {word: get_word_embedding(word) for word in unique_words}

        return word_embeddings

    except Exception as e:
        print(f"An error occurred: {e}")
        return None

def normalize_vector(vector):
    magnitude = np.linalg.norm(vector)
    if magnitude > 0:
        return vector / magnitude
    else:
        return vector
    
def get_word_embedding(word):
    embedding = client.embeddings.create(input=[word], model="text-embedding-ada-002").data[0].embedding

    # Normalize the vector
    normalized_embedding = normalize_vector(embedding)

    return normalized_embedding

def save_word_embeddings_to_file(word_embeddings, output_file):
    try:
        # Convert NumPy arrays to Python lists before saving to JSON
        word_embeddings_serializable = {word: emb.tolist() for word, emb in word_embeddings.items()}

        with open(output_file, 'w', encoding='utf-8') as json_file:
            json.dump(word_embeddings_serializable, json_file, ensure_ascii=False, indent=4)
        print(f"Word embeddings saved to {output_file}")
    except Exception as e:
        print(f"An error occurred while saving word embeddings: {e}")

# Example usage
yaml_file_path = 'content.yaml'
output_file_path = 'word_embedding/word_embeddings.json'
client = OpenAI()
word_embeddings = scrape_and_embed_words(yaml_file_path)

if word_embeddings is not None:
    save_word_embeddings_to_file(word_embeddings, output_file_path)
