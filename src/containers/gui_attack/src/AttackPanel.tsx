import { FormEvent, Suspense, useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { Form, Spinner } from "react-bootstrap";
import { Button, Card, Col, Container, InputGroup, Modal, Row } from "react-bootstrap";
import { JsonObject } from "react-use-websocket/dist/lib/types";
import { useWebSocket } from "react-use-websocket/dist/lib/use-websocket";
import { atom, selector, useRecoilState } from "recoil";
import { getCCWebSocketURL } from "./Config";
import { shipListShown } from "./ShipList";
import { selectedShip } from './ShipPanel'

const shouldShow = atom({ key: 'shouldShowAttackPanel', default: false })
export const attackPanelShown = selector({
    key: 'attackPanelShown',
    get: ({ get }) => get(shouldShow),
    set: ({ set }, newValue) => {
        if (newValue) {
            set(shouldShow, true)
            set(shipListShown, false)
            set(selectedShip, null)
        }
    }
})

function DynamicAttackNumberField(
    { 
        value,
        setValue,
        onValidStateChange,
        ...props
    }:
    {
        value: any,
        setValue: (value: any) => void,
        onValidStateChange: (isValid: boolean) => void,
        [props: string]: any
    }
) {
    const propertiesStringElements = useMemo(() => {
        const elements = []
        if (typeof props.min === 'number' && typeof props.max === 'number') {
            elements.push(`range: ${props.min}-${props.max}`)
        } else if (typeof props.min === 'number') {
            elements.push(`min: ${props.min}`)
        } else if (typeof props.max === 'number') {
            elements.push(`max: ${props.max}`)
        }
        if (props.required) elements.push(`required`)
        return elements
    }, [ props ])
    const isValid = useMemo(() => {
        if (props.required && !value && !value.default) return false
        if (typeof props.min === 'number' && value < props.min) return false
        if (typeof props.max === 'number' && value > props.max) return false
        return true
    }, [ value ])
    useEffect(() => onValidStateChange(isValid), [ isValid ])
    return (
        <Form.Group>
            <Form.Label>{props.description}</Form.Label>
            <Form.Control type="number" min={props.min} max={props.max} value={value} onChange={e => setValue(e.target.value)} isValid={isValid} isInvalid={!isValid} name={props.name}></Form.Control>
            <Form.Text muted>
                {propertiesStringElements.join(' ')}
            </Form.Text>
        </Form.Group>
    )
}

function DynamicAttack(props: any) {
    // Attack state
    const rpcId = useId()
    const [ isAttackRunning, setAttackRunning ] = useState<boolean | null>(null)
    const { sendJsonMessage, lastJsonMessage } = useWebSocket<JsonObject>(getCCWebSocketURL)

    useEffect(() => {
        if (isAttackRunning === null) {
            sendJsonMessage({ 'method': 'attack_state', 'params': [ props.name ], 'id': rpcId })
            console.debug('Sent rpc enquiry about attack', props.name)
        }
    }, [ sendJsonMessage, isAttackRunning ])

    useEffect(() => {
        if (lastJsonMessage && lastJsonMessage.id === rpcId && lastJsonMessage.result && typeof lastJsonMessage.result === 'object') {
            const result = lastJsonMessage.result
            if (Array.isArray(result)) return
            const running = result.running
            if (typeof running === 'boolean') {
                console.debug('Attack status', props.name, running)
                setAttackRunning(running)
            }
        }
    }, [ rpcId, lastJsonMessage ])

    // Form state
    const [ fields, setFields ] = useState<any>({})
    const [ fieldValidity, setFieldsValidity ] = useState<any>({})

    const isValid = useMemo(() => Object.values(fieldValidity).every(x => x), [ fieldValidity ])

    // Callbacks to pass down
    const getFieldSetter = useCallback((name: string) => {
        if (fields[name] === undefined) {
            setFields((originalFields: any) => ({ ...originalFields, [name]: '' }))
        }
        return (value: any) => setFields((originalFields: any) => ({ ...originalFields, [name]: value }))
    }, [ fields, setFields ])

    const getFieldValiditySetter = useCallback((name: string) => {
        return (value: boolean) => setFieldsValidity((originalFieldsValidity: any) => ({ ...originalFieldsValidity, [name]: value }))
    }, [ setFieldsValidity ])

    // Submit handler
    const onSubmit = useCallback((e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const filteredFields: any[] = [ props.name ]
        for (const param of props.parameters) {
            if (fields[param.name] !== '') {
                if (param.type === 'number') filteredFields.push(parseFloat(fields[param.name]))
            }
        }
        if (isAttackRunning) {
            sendJsonMessage({ id: rpcId, method: 'attack_stop', params: [ props.name ] })
        } else {
            sendJsonMessage({ id: rpcId, method: 'attack_start', params: filteredFields })
        }
    }, [ fields, isAttackRunning ])

    return (
        <>
            <h2>{props.ui_name}</h2>
            <p>{props.description}</p>
            <Form onSubmit={onSubmit}>
                {isAttackRunning !== true && props.parameters && Array.isArray(props.parameters) && props.parameters.map((params: any) => (
                    <DynamicAttackNumberField key={params.name} value={fields[params.name]} setValue={getFieldSetter(params.name)} onValidStateChange={getFieldValiditySetter(params.name)} {...params} />
                ))}
                <Button className="mt-3 w-100 text-uppercase" type="submit" disabled={(isAttackRunning === null || !isValid) && isAttackRunning !== true} variant={isAttackRunning ? 'danger' : 'success'}>
                    {isAttackRunning ? 'Stop' : 'Start'}
                    {isAttackRunning === null && (<Spinner/>)}
                </Button>
            </Form>
        </>
    )
}

function AttackInventory() {
    const rpcId = useId()
    const [ attackInventory, setAttackInventory ] = useState<any[] | null>(null)
    const { sendJsonMessage, lastJsonMessage } = useWebSocket<JsonObject>(getCCWebSocketURL)
    useEffect(() => {
        sendJsonMessage({ method: 'attack_inventory', id: rpcId })
    }, [ rpcId, sendJsonMessage ])
    useEffect(() => {
        if (!lastJsonMessage || lastJsonMessage.id !== rpcId) return
        setAttackInventory(lastJsonMessage.result as any[])
    }, [ lastJsonMessage ])
    return (
        <Container className="d-flex flex-column gap-2">
            {attackInventory && attackInventory.sort((a, b) => a.name.localeCompare(b.name)).map((attack, i) => (
                <Card key={i}>
                    <Card.Body>
                        <DynamicAttack {...attack}/>
                    </Card.Body>
                </Card>
            ))}
        </Container>
    )
}

export default function AttackPanel() {
    const [shown, setShown] = useRecoilState(shouldShow)
    return (
        <Modal show={shown} placement={'bottom'} onHide={() => setShown(false)} size={'xl'}>
            <Modal.Header closeButton>
                <Modal.Title>Attacks</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Container>
                    <Suspense fallback={<Spinner/>}>
                        <AttackInventory/>
                    </Suspense>
                </Container>
            </Modal.Body>
        </Modal>
    )
}