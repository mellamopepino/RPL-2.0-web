/* eslint-disable react/destructuring-assignment */
// @flow
import React from "react";
import Button from "@material-ui/core/Button";
import { withStyles } from "@material-ui/core/styles";
import { withState } from "../../utils/State";

import Breadcrumbs from "@material-ui/core/Breadcrumbs";
import Link from "@material-ui/core/Link";
import { Link as RouterLink } from "react-router-dom";
const LinkRouter = props => <Link {...props} component={RouterLink} />;

const styles = theme => ({
  secondHeader: {
    backgroundColor: theme.palette.background.default,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "8px",
    margin: `-${theme.spacing(3)}px -${theme.spacing(3)}px 0px -${theme.spacing(3)}px`, // Force the second header to override layout
  },
  secondHeaderTitle: {
    alignSelf: "center",
    margin: "0px",
    color: theme.palette.text.primary,
    fontFamily: "Arial, Verdana, san-serif",
  },
  topLeftButtons: {
    minWidth: "200px",
  },
  topRightButtons: {
    alignSelf: "flex-end",
  },
  rightButton: {
    marginRight: "5px",
  },
});

type Props = {
  handleSubmitActivity: Event => void,
  handleOpenPastSubmissionsSidePanel: void => void,
  activity: string,
  classes: any,
  style: any,
  history: any,
  canShowOtherSolutions: boolean,
  onlyTitle: boolean,
};

function getLeftTitle(
  history: any,
  permissions: Array<string>,
  classes: any,
  canShowOtherSolutions: boolean
) {
  if (permissions.includes("activity_manage")) {
    return (
      <Button
        className={classes.rightButton}
        onClick={() => history.push(`${history.location.pathname}/edit`)}
      >
        Volver a modo profesor
      </Button>
    );
  }
  return (
    <Button
      type="submit"
      variant="contained"
      className={classes.rightButton}
      disabled={!canShowOtherSolutions}
      onClick={() => history.push(`${history.location.pathname}/definitives`)}
    >
      Ver otras soluciones
    </Button>
  );
}

function SolvePageHeader(props: Props) {
  const { course } = props.context;
  const { activity } = props;
  return (
    <div style={props.style} className={props.classes.secondHeader}>
      <Breadcrumbs aria-label="breadcrumb">
        <LinkRouter color="inherit" to={`/courses/${course.id}/dashboard`}>
          {props.context.course.name}
        </LinkRouter>
        <LinkRouter color="inherit" to={`/courses/${course.id}/activities`}>
          Actividades
        </LinkRouter>
        <LinkRouter color="inherit" to={props.history.location.pathname}>
          {activity.name}
        </LinkRouter>
      </Breadcrumbs>
      {!props.onlyTitle && (
        <div className={props.classes.topRightButtons}>
          {getLeftTitle(
            props.history,
            props.context.permissions,
            props.classes,
            props.canShowOtherSolutions
          )}
          <Button
            type="submit"
            variant="contained"
            color="primary"
            className={props.classes.rightButton}
            onClick={e => props.handleOpenPastSubmissionsSidePanel()}
          >
            Mis entregas
          </Button>
          <Button
            type="submit"
            variant="contained"
            color="secondary"
            onClick={e => props.handleSubmitActivity(e)}
          >
            Entregar
          </Button>
        </div>
      )}
    </div>
  );
}

export default withState(withStyles(styles)(SolvePageHeader));
