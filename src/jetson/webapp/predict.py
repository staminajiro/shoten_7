# coding: utf-8

from PIL import Image
import torch
import torch.nn as nn
import torch.optim as optim
from torch.optim import lr_scheduler
import torchvision
from torchvision import transforms

# model_path = '../models/janken_model.dat'
model_path = '../models/resnet50_5.dat'

class_names = ['choki', 'goo', 'paa']
class_num = len(class_names)

def init_model():
    model_conv = torchvision.models.resnet50()
    for param in model_conv.parameters():
        param.requires_grad = False
        
    num_ftrs = model_conv.fc.in_features
    model_conv.fc = nn.Linear(num_ftrs, class_num)

    device = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")
    print(device)
    model_conv = model_conv.to(device)
    print("start loading")
    model_conv.load_state_dict(torch.load(model_path))
    print("finish loading")
    model_conv.eval()
    return model_conv

model_conv = init_model()

def predict_from_imagepath(image_path):
    image = Image.open(image_path)
    return predict(image)

def predict(image):
    data_transform = transforms.Compose([
            transforms.Resize(256),
            transforms.CenterCrop(224),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])])

    image = data_transform(image).unsqueeze(0).cuda()
    print("start predicting")
    out = model_conv(image)
    print("finish predicting", out, out.argmax())
    class_name = class_names[out.argmax()]
    print("Predicted class is: {}".format(class_name))
    return class_name
