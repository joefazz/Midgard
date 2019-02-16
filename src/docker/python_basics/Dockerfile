FROM python:3

WORKDIR /usr/src/app

COPY package_requirements.txt ./

RUN pip install --no-cache-dir -r package_requirements.txt

COPY . .

CMD [ "python" ]
