from awsiot import mqtt_connection_builder
from awscrt import mqtt
import time

ENDPOINT = "a11nnr24z6692d-ats.iot.eu-north-1.amazonaws.com"

CLIENT_ID = "signal-room-debug-20261004"

CERTIFICATE = "certs/device.pem.crt"
PRIVATE_KEY = "certs/private.pem.key"
ROOT_CA = "certs/AmazonRootCA1.pem"

TOPIC = "signal-room/data"

print("Starting AWS IoT test...")
print("Endpoint:", ENDPOINT)
print("Client ID:", CLIENT_ID)

mqtt_connection = mqtt_connection_builder.mtls_from_path(
    endpoint=ENDPOINT,
    cert_filepath=CERTIFICATE,
    pri_key_filepath=PRIVATE_KEY,
    ca_filepath=ROOT_CA,
    client_id=CLIENT_ID,
    clean_session=True,
    keep_alive_secs=30
)

print("Connecting to AWS IoT...")

connect_future = mqtt_connection.connect()

try:
    connect_future.result(timeout=15)

    print("")
    print("==============================")
    print("CONNECTED TO AWS IOT!")
    print("==============================")
    print("")

    message = '{"temperature":25,"humidity":60}'

    print("Publishing:", message)

    publish_future, packet_id = mqtt_connection.publish(
        topic=TOPIC,
        payload=message,
        qos=mqtt.QoS.AT_LEAST_ONCE
    )

    publish_future.result(timeout=15)

    print("MESSAGE SENT!")
    print("Packet ID:", packet_id)

    time.sleep(2)

finally:
    print("Disconnecting...")

    disconnect_future = mqtt_connection.disconnect()

    try:
        disconnect_future.result(timeout=15)
    except Exception:
        pass

    print("DISCONNECTED")
