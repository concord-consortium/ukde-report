import * as React from "react"
import {StudentMultipleChoiceAnswer} from "./app"

export interface AnswerCellRendererComponentProps {
  value: StudentMultipleChoiceAnswer
}

export interface AnswerCellRendererComponentState {
}

export class AnswerCellRendererComponent extends React.Component<AnswerCellRendererComponentProps, AnswerCellRendererComponentState> {
  constructor (props:AnswerCellRendererComponentProps) {
    super(props)
    this.state = {
    }
  }

  render() {
    const {answered, correct} = this.props.value
    const answeredSpan = answered ? <span className="answered">Y</span> : <span className="not-answered">N</span>
    const correctSpan = answered ? (correct ? <span className="correct">C</span> : <span className="incorrect">I</span>) : null
    return <span className="answer">{answeredSpan}{correctSpan}</span>
  }
}