import {
	Button,
	Flex,
	FormControl,
	FormErrorMessage,
	FormLabel,
	Input,
	Image,
	InputRightElement,
	Select,
	SimpleGrid,
	Text,
	Textarea,
	Grid,
	Modal,
	CircularProgress,
	CircularProgressLabel,
	Heading,
	ModalBody,
	ModalContent,
	ModalOverlay,
	useToast,
} from "@chakra-ui/react";
import { useUser } from "@libs/store";
import axios from "axios";
import { Formik } from "formik";
import { useRouter } from "next/router";
import { useState } from "react";
import { MdClose, MdSave } from "react-icons/md";
import * as yup from "yup";
import { InputField } from "./InputField";

const CarSchema = yup.object().shape({
	title: yup.string().required("You have to add string"),
	description: yup.string(),
	model: yup.string(),
	price: yup.number().min(0).required(),
	files: yup.array().min(1, "Add at least one photo"),
	rent: yup.boolean(),
});

export const AddCar = ({ user }) => {
	const router = useRouter();
	const toast = useToast();
	const [uploadProgress, setUploadProgress] = useState(0);

	const initialValues = {
		title: "",
		description: "",
		price: 0.0,
		priceType: "FIXED",
		itemType: "CAR",
		files: [],

		model: "",
		status: "USED",
		manufacturer: "",
		year: new Date().getFullYear(),
		transmition: "AUTO",
		color: "",
		cylinder: 0.0,
		fuel: 0.0,
	};

	const onSubmit = (values, actions) => {
		const formdata = new FormData();
		const { files, ...others } = values;

		for (let key in others) {
			formdata.append(key, others[key]);
		}
		files.forEach((file) => {
			formdata.append("files", file);
		});

		actions.setSubmitting(true);

		axios
			.post("/api/items/add", formdata, {
				headers: {
					"Content-Type": "multipart/form-data",
				},

				onUploadProgress: (event) => {
					setUploadProgress((event.loaded * 100) / event.total);
				},
			})
			.then((res) => {
				const { msg } = res.data;

				toast({
					title: "Success",
					status: "success",
					description: msg,
					isClosable: true,
				});
				router.push("/dashboard");
			})
			.catch((error) => {
				const err = error?.response?.data?.err || error?.message || "Unable to submit your listing";
				toast({
					title: "Error",
					status: "error",
					description: err,
					isClosable: true,
				});
			})
			.finally(() => {
				actions.setSubmitting(false);
			});
	};

	return (
		<Formik
			initialValues={initialValues}
			validationSchema={CarSchema}
			onSubmit={onSubmit}
		>
			{(formik) => (
				<form onSubmit={formik.handleSubmit}>
					<Flex direction={"column"}>
						<Modal
							closeOnOverlayClick={false}
							closeOnEsc={false}
							onClose={() => {}}
							isOpen={formik.isSubmitting}
						>
							<ModalOverlay></ModalOverlay>
							<ModalContent p="10">
								<ModalBody
									display={"flex"}
									flexDirection={"column"}
									alignItems={"center"}
									justifyContent="center"
								>
									<CircularProgress
										size={"150px"}
										value={uploadProgress}
									>
										<CircularProgressLabel>
											{uploadProgress}%
										</CircularProgressLabel>
									</CircularProgress>
									<Heading mt="4" fontSize="lg">
										Uploading Images...
									</Heading>
								</ModalBody>
							</ModalContent>
						</Modal>
						<SimpleGrid spacing="5" mb="2">
							<InputField
								formik={formik}
								label="Title"
								name="title"
								type="text"
							/>
						</SimpleGrid>
						<SimpleGrid columns={[1, 2, 3]} spacing="5" my="2">
							<FormControl>
								<FormLabel>Price Type</FormLabel>
								<Select
									name="priceType"
									value={formik.values.priceType}
									onChange={formik.handleChange}
									variant={"filled"}
								>
									<option value="FIXED">Fixed</option>
									<option value="NEGOTIABLE">
										Negotiable
									</option>
								</Select>
							</FormControl>
							<InputField
								formik={formik}
								label="Price"
								name="price"
								type="number"
								suffix={<Text>ETB</Text>}
							/>
							<FormControl>
								<FormLabel>Car Status</FormLabel>
								<Select
									name="status"
									value={formik.values.status}
									onChange={formik.handleChange}
									variant={"filled"}
								>
									<option value="USED">Used Car</option>
									<option value="NEW">Brand New</option>
									<option value="NEW_ETH">
										New in Ethiopia
									</option>
								</Select>
							</FormControl>
						</SimpleGrid>
						<SimpleGrid columns={[1, 2, 3]} spacing="5" my="2">
							<InputField
								formik={formik}
								label="Manufacturer"
								name="manufacturer"
								type="text"
							/>
							<InputField
								formik={formik}
								label="Model"
								name="model"
								type="text"
							/>
							<InputField
								formik={formik}
								label="Year"
								name="year"
								type="year"
							/>
						</SimpleGrid>
						<SimpleGrid columns={[1, 2]} spacing="5" my="2">
							<FormControl>
								<FormLabel>Car Transmission</FormLabel>
								<Select
									name="transmition"
									value={formik.values.transmition}
									onChange={formik.handleChange}
									variant={"filled"}
								>
									<option value="MANUAL">Manual</option>
									<option value="AUTO">Automatic</option>
								</Select>
							</FormControl>

							<InputField
								formik={formik}
								label="Color"
								name="color"
								type="text"
							/>
						</SimpleGrid>
						<SimpleGrid columns={[1, 2]} spacing="5" my="2">
							<InputField
								formik={formik}
								label="Fuel"
								name="fuel"
								type="number"
								suffix={<Text>lt/km</Text>}
							/>
							<InputField
								formik={formik}
								label="Cylinder size"
								name="cylinder"
								type="number"
							/>
						</SimpleGrid>
						<FormControl
							my="2"
							isInvalid={!!formik.errors.description}
						>
							<FormLabel>Description</FormLabel>
							<Textarea
								variant="filled"
								name="description"
								value={formik.values.description}
								onChange={formik.handleChange}
							></Textarea>
							{!!formik.errors.description && (
								<FormErrorMessage>
									{formik.errors.description}
								</FormErrorMessage>
							)}
						</FormControl>
						<FormControl my="2">
							<FormLabel>Photos</FormLabel>
							<Input
								onChange={(ev) => {
									let files = ev.target.files;
									formik.setFieldValue(
										"files",
										Array.from(files)
									);
								}}
								variant={"filled"}
								type="file"
								name="files"
								accept="image/*"
								placeholder="images"
								multiple
							></Input>
						</FormControl>
						<Grid
							gridTemplateColumns="repeat(auto-fit, 200px)"
							gap={"5"}
							my="4"
						>
							{formik.values.files.map((file, index) => {
								return (
									<Image
										alt={"Selected listing photo " + (index + 1)}
										key={index}
										background={"black"}
										boxShadow="md"
										borderRadius={"md"}
										width={"200px"}
										height={"200px"}
										objectFit="contain"
										src={URL.createObjectURL(file)}
									></Image>
								);
							})}
						</Grid>
						<Flex mt="10" justifyContent={"flex-end"}>
							<Button
								mr="5"
								colorScheme={"red"}
								leftIcon={<MdSave />}
								type="submit"
								isDisabled={formik.isSubmitting}
							>
								{formik.isSubmitting
									? "Submitting..."
									: "Submit"}
							</Button>
							<Button type="button" leftIcon={<MdClose />} onClick={() => router.push("/dashboard")}>Cancel</Button>
						</Flex>{" "}
					</Flex>
				</form>
			)}
		</Formik>
	);
};
